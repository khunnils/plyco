import { z } from "zod"

import { ApiError } from "./errors.js"

const AIRTABLE_API_URL = "https://api.airtable.com/v0"

const airtableRecordSchema = z.object({
  id: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
})

const airtableResponseSchema = z.object({
  records: z.array(airtableRecordSchema),
  offset: z.string().optional(),
})

const airtableMutationResponseSchema = z.object({
  records: z.array(airtableRecordSchema),
})

export type AirtableRecord = z.infer<typeof airtableRecordSchema>

export const stringField = (
  fields: Record<string, unknown>,
  ...names: string[]
): string => {
  for (const name of names) {
    const value = fields[name]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

export const numberField = (
  fields: Record<string, unknown>,
  ...names: string[]
): number | undefined => {
  for (const name of names) {
    const value = fields[name]

    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value)
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.trim())

      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed)
      }
    }
  }

  return undefined
}

export const linkedRecordIds = (
  fields: Record<string, unknown>,
  ...names: string[]
): string[] => {
  for (const name of names) {
    const value = fields[name]

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
    }

    // Airtable single-record links are returned as a string id, not a one-item array.
    if (typeof value === "string" && value.length > 0) {
      return [value]
    }
  }

  return []
}

export async function listAirtableRecords({
  apiKey,
  baseId,
  errorCode = "AIRTABLE_LOAD_FAILED",
  filterByFormula,
  tableName,
}: {
  apiKey: string
  baseId: string
  errorCode?: string
  filterByFormula?: string
  tableName: string
}): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const url = new URL(
      `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`,
    )
    url.searchParams.set("pageSize", "100")

    if (filterByFormula) {
      url.searchParams.set("filterByFormula", filterByFormula)
    }

    if (offset) {
      url.searchParams.set("offset", offset)
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      throw new ApiError(
        errorCode,
        `Unable to load Airtable table ${tableName}.`,
        502,
        {
          status: response.status,
          statusText: response.statusText,
          body: (await response.text()).slice(0, 1000),
        },
      )
    }

    const body = airtableResponseSchema.parse(await response.json())
    records.push(...body.records)
    offset = body.offset
  } while (offset)

  return records
}

export async function createAirtableRecord({
  apiKey,
  baseId,
  errorCode = "AIRTABLE_CREATE_FAILED",
  fields,
  tableName,
}: {
  apiKey: string
  baseId: string
  errorCode?: string
  fields: Record<string, unknown>
  tableName: string
}) {
  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    },
  )

  if (!response.ok) {
    throw new ApiError(errorCode, `Unable to create Airtable ${tableName} record.`, 502, {
      status: response.status,
      statusText: response.statusText,
      body: (await response.text()).slice(0, 1000),
    })
  }

  const record = airtableMutationResponseSchema.parse(await response.json()).records[0]

  if (!record) {
    throw new ApiError(
      errorCode,
      `Airtable did not return the created ${tableName} record.`,
      502,
    )
  }

  return record
}

export async function updateAirtableRecord({
  apiKey,
  baseId,
  errorCode = "AIRTABLE_UPDATE_FAILED",
  fields,
  recordId,
  tableName,
}: {
  apiKey: string
  baseId: string
  errorCode?: string
  fields: Record<string, unknown>
  recordId: string
  tableName: string
}) {
  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ id: recordId, fields }] }),
    },
  )

  if (!response.ok) {
    throw new ApiError(errorCode, `Unable to update Airtable ${tableName} record.`, 502, {
      status: response.status,
      statusText: response.statusText,
      body: (await response.text()).slice(0, 1000),
    })
  }

  const record = airtableMutationResponseSchema.parse(await response.json()).records[0]

  if (!record) {
    throw new ApiError(
      errorCode,
      `Airtable did not return the updated ${tableName} record.`,
      502,
    )
  }

  return record
}
