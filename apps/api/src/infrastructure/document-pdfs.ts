import { randomUUID } from "node:crypto"

import { Storage } from "@google-cloud/storage"
import PDFDocument from "pdfkit"

import { type Template } from "@plyco/shared"

import { ApiError } from "./errors.js"

const pageMargins = { top: 56, right: 56, bottom: 56, left: 56 }

export type StoredDocumentPdf = {
  objectPath: string
}

export interface DocumentPdfStorage {
  generateAndUpload(input: {
    organizationId: string
    template: Template
    title: string
    renderedContent: string
  }): Promise<StoredDocumentPdf | null>
  regenerateAndUpload(input: {
    objectPath: string
    title: string
    renderedContent: string
  }): Promise<Buffer>
  download(objectPath: string): Promise<Buffer>
}

export class NullDocumentPdfStorage implements DocumentPdfStorage {
  async generateAndUpload(): Promise<StoredDocumentPdf | null> {
    return null
  }

  async download(): Promise<Buffer> {
    throw new ApiError(
      "DOCUMENT_PDF_NOT_AVAILABLE",
      "Generated document PDF is not available.",
      404,
    )
  }

  async regenerateAndUpload(): Promise<Buffer> {
    throw new ApiError(
      "DOCUMENT_PDF_NOT_AVAILABLE",
      "Generated document PDF is not available.",
      404,
    )
  }
}

export class GcsDocumentPdfStorage implements DocumentPdfStorage {
  private readonly storage: Storage

  constructor(
    private readonly bucketName: string,
    storage = new Storage(),
  ) {
    this.storage = storage
  }

  async generateAndUpload(input: {
    organizationId: string
    template: Template
    title: string
    renderedContent: string
  }): Promise<StoredDocumentPdf> {
    const objectPath = [
      "documents",
      input.organizationId,
      `${input.template.slug}-${randomUUID()}.pdf`,
    ].join("/")
    const buffer = await renderDocumentPdf({
      title: input.title,
      content: input.renderedContent,
    })

    await this.uploadBuffer(objectPath, buffer, input.template.slug)

    return {
      objectPath,
    }
  }

  async regenerateAndUpload(input: {
    objectPath: string
    title: string
    renderedContent: string
  }): Promise<Buffer> {
    const buffer = await renderDocumentPdf({
      title: input.title,
      content: input.renderedContent,
    })

    await this.uploadBuffer(input.objectPath, buffer, input.title)

    return buffer
  }

  async download(objectPath: string): Promise<Buffer> {
    try {
      const [buffer] = await this.storage
        .bucket(this.bucketName)
        .file(objectPath)
        .download()

      return buffer
    } catch (error) {
      throwDocumentPdfUploadError(error, this.bucketName)
    }
  }

  private async uploadBuffer(
    objectPath: string,
    buffer: Buffer,
    filename: string,
  ) {
    try {
      await this.storage.bucket(this.bucketName).file(objectPath).save(buffer, {
        contentType: "application/pdf",
        resumable: false,
        metadata: {
          cacheControl: "private, max-age=0, no-store",
          contentDisposition: `attachment; filename="${safePdfFilename(filename)}"`,
        },
      })
    } catch (error) {
      throwDocumentPdfUploadError(error, this.bucketName)
    }
  }
}

async function renderDocumentPdf(input: {
  title: string
  content: string
}): Promise<Buffer> {
  const document = new PDFDocument({
    autoFirstPage: false,
    margins: pageMargins,
    size: "A4",
  })
  const chunks: Buffer[] = []

  document.on("data", (chunk: Buffer) => chunks.push(chunk))
  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)))
    document.on("error", reject)
  })

  document.addPage()
  document
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0f172a")
    .text(input.title, { lineGap: 4 })
    .moveDown(0.8)

  writeMarkdownContent(document, input.content)

  document.end()
  return finished
}

function writeMarkdownContent(document: PDFKit.PDFDocument, content: string) {
  const lines = content.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const table = parseMarkdownTable(lines, index)

    if (table) {
      writeMarkdownTable(document, table.rows)
      index = table.endIndex
      continue
    }

    writeMarkdownLine(document, lines[index] ?? "")
  }
}

function writeMarkdownLine(document: PDFKit.PDFDocument, line: string) {
  const trimmedLine = line.trim()

  if (!trimmedLine) {
    document.moveDown(0.7)
    return
  }

  const heading = /^(#{1,3})\s+(.+)$/.exec(trimmedLine)

  if (heading) {
    const level = heading[1]?.length ?? 1
    document
      .moveDown(level === 1 ? 0.8 : 0.5)
      .font("Helvetica-Bold")
      .fontSize(level === 1 ? 18 : level === 2 ? 15 : 13)
      .fillColor("#0f172a")
      .text(heading[2] ?? "", { lineGap: 3 })
      .moveDown(0.2)
    return
  }

  const bullet = /^[-*]\s+(.+)$/.exec(trimmedLine)

  if (bullet) {
    document
      .font("Helvetica")
      .fontSize(10.5)
      .fillColor("#334155")
      .text(`- ${bullet[1] ?? ""}`, { indent: 12, lineGap: 3 })
    return
  }

  document
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#334155")
    .text(trimmedLine, { lineGap: 3 })
}

function parseMarkdownTable(lines: string[], startIndex: number) {
  const headerLine = lines[startIndex]?.trim()
  const separatorLine = lines[startIndex + 1]?.trim()

  if (!headerLine || !separatorLine) {
    return null
  }

  const header = parseMarkdownTableRow(headerLine)
  const separator = parseMarkdownTableRow(separatorLine)

  if (!header || !separator || !isMarkdownTableSeparator(separator)) {
    return null
  }

  const rows = [header]
  let endIndex = startIndex + 1

  for (let index = startIndex + 2; index < lines.length; index += 1) {
    const row = parseMarkdownTableRow(lines[index] ?? "")

    if (!row) {
      break
    }

    rows.push(row)
    endIndex = index
  }

  return { endIndex, rows }
}

function parseMarkdownTableRow(line: string) {
  const trimmedLine = line.trim()

  if (!trimmedLine.startsWith("|") || !trimmedLine.endsWith("|")) {
    return null
  }

  return trimmedLine
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim())
}

function isMarkdownTableSeparator(cells: string[]) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function writeMarkdownTable(
  document: PDFKit.PDFDocument,
  rows: string[][],
) {
  if (rows.length === 0) {
    return
  }

  document.moveDown(0.4)

  const columnCount = Math.max(...rows.map((row) => row.length))
  const tableWidth = document.page.width - pageMargins.left - pageMargins.right
  const columnWidths = tableColumnWidths(rows, tableWidth, columnCount)
  const header = rows[0] ?? []
  const body = rows.slice(1)

  writeTableRow(document, header, columnWidths, true)

  for (const row of body) {
    writeTableRow(document, row, columnWidths, false)
  }

  document.moveDown(0.8)
}

function tableColumnWidths(
  rows: string[][],
  tableWidth: number,
  columnCount: number,
) {
  const weights = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = Math.max(
      ...rows.map((row) => (row[columnIndex] ?? "").length),
    )

    return Math.min(Math.max(maxLength, 8), 28)
  })
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  return weights.map((weight) => (weight / totalWeight) * tableWidth)
}

function writeTableRow(
  document: PDFKit.PDFDocument,
  row: string[],
  columnWidths: number[],
  isHeader: boolean,
) {
  const padding = 4
  const fontSize = isHeader ? 7.5 : 7
  const lineGap = 1.5
  const rowHeight = Math.max(
    20,
    ...columnWidths.map((width, index) => {
      document.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize)

      return (
        document.heightOfString(row[index] ?? "", {
          width: width - padding * 2,
          lineGap,
        }) +
        padding * 2
      )
    }),
  )

  ensureVerticalSpace(document, rowHeight)

  const startX = pageMargins.left
  const startY = document.y
  let currentX = startX

  for (const [index, width] of columnWidths.entries()) {
    if (isHeader) {
      document.rect(currentX, startY, width, rowHeight).fill("#f8fafc")
    }

    document.rect(currentX, startY, width, rowHeight).stroke("#cbd5e1")
    document
      .font(isHeader ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fontSize)
      .fillColor(isHeader ? "#0f172a" : "#334155")
      .text(row[index] ?? "", currentX + padding, startY + padding, {
        lineGap,
        width: width - padding * 2,
      })

    currentX += width
  }

  document.x = startX
  document.y = startY + rowHeight
}

function ensureVerticalSpace(
  document: PDFKit.PDFDocument,
  requiredHeight: number,
) {
  const bottomY = document.page.height - pageMargins.bottom

  if (document.y + requiredHeight > bottomY) {
    document.addPage()
  }
}

function safePdfFilename(slug: string) {
  return `${slug.replace(/[^a-z0-9-]/g, "-")}.pdf`
}

function throwDocumentPdfUploadError(error: unknown, bucketName: string): never {
  const googleError = parseGoogleStorageError(error)

  if (googleError.error === "invalid_grant") {
    throw new ApiError(
      "DOCUMENT_PDF_GCP_AUTH_EXPIRED",
      "Google Cloud credentials for PDF upload have expired. Reauthenticate Application Default Credentials or configure a service account.",
      503,
      googleError,
    )
  }

  if (googleError.status === 401) {
    throw new ApiError(
      "DOCUMENT_PDF_GCP_UNAUTHENTICATED",
      "Google Cloud credentials are required to upload generated document PDFs.",
      503,
      googleError,
    )
  }

  if (googleError.status === 403 || googleError.code === 403 || googleError.code === "403" || googleError.message?.includes("does not have storage.objects.create access") || googleError.message?.includes("Permission 'storage.objects.create' denied")) {
    throw new ApiError(
      "DOCUMENT_PDF_GCP_FORBIDDEN",
      `Google Cloud credentials do not have permission to upload to the bucket "${bucketName}".`,
      503,
      googleError,
    )
  }

  if (googleError.status === 404 || googleError.code === 404 || googleError.code === "404") {
    throw new ApiError(
      "DOCUMENT_PDF_BUCKET_NOT_FOUND",
      `The Google Cloud Storage bucket "${bucketName}" was not found. Please check your DOCUMENT_PDF_BUCKET configuration.`,
      503,
      googleError,
    )
  }

  throw new ApiError(
    "DOCUMENT_PDF_UPLOAD_FAILED",
    `Generated document PDF could not be uploaded to bucket "${bucketName}".`,
    503,
    googleError,
  )
}

function parseGoogleStorageError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) }
  }

  const record = error as {
    code?: unknown
    message?: unknown
    status?: unknown
    response?: {
      status?: unknown
      data?: {
        error?: unknown
        error_description?: unknown
        error_subtype?: unknown
      }
    }
  }

  return {
    code: typeof record.code === "number" ? record.code : typeof record.code === "string" ? record.code : undefined,
    error:
      typeof record.response?.data?.error === "string"
        ? record.response.data.error
        : undefined,
    errorDescription:
      typeof record.response?.data?.error_description === "string"
        ? record.response.data.error_description
        : undefined,
    errorSubtype:
      typeof record.response?.data?.error_subtype === "string"
        ? record.response.data.error_subtype
        : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    status:
      typeof record.status === "number"
        ? record.status
        : typeof record.response?.status === "number"
          ? record.response.status
          : undefined,
  }
}
