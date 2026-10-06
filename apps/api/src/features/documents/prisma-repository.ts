import {
  mapDocumentRecord,
  mapTemplateRecord,
  prisma,
  Prisma,
  type PrismaClient,
} from "@plyco/db";
import {
  type Document,
  type DocumentSummary,
  type SystemTemplate,
  type Template,
  type TemplateInput,
} from "@plyco/contracts";

import { ApiError } from "../../infrastructure/errors.js";
import { type OrganizationRepository } from "../organizations/repository.js";
import {
  type DocumentFreshness,
  type DocumentRepository,
  type PublicDocument,
} from "./repository.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniquePublicSlug(name: string, existing: Set<string>) {
  const root = slugify(name) || "organization";

  if (!existing.has(root)) {
    return root;
  }

  let suffix = 2;
  let candidate = `${root}-${suffix}`;

  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }

  return candidate;
}

function sourceFingerprintJson(fingerprint: Document["sourceFingerprint"]) {
  return fingerprint as Prisma.InputJsonValue;
}

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly client: PrismaClient = prisma,
  ) {}

  async listTemplates(organizationId: string): Promise<Template[]> {
    const templates = await this.client.template.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });

    return templates.map(mapTemplateRecord);
  }

  async createTemplateFromSystem(
    organizationId: string,
    systemTemplate: SystemTemplate,
  ): Promise<Template> {
    try {
      const template = await this.client.template.create({
        data: {
          organizationId,
          name: systemTemplate.name,
          slug: systemTemplate.slug,
          sourceSystemTemplateSlug: systemTemplate.slug,
          content: systemTemplate.content,
        },
      });

      return mapTemplateRecord(template);
    } catch (error) {
      this.throwTemplateConflict(error, systemTemplate.slug);
    }
  }

  async createTemplate(
    organizationId: string,
    input: TemplateInput,
  ): Promise<Template> {
    const slug = slugify(input.name) || "template";
    try {
      const template = await this.client.template.create({
        data: {
          organizationId,
          name: input.name,
          slug,
          sourceSystemTemplateSlug: null,
          content: input.content,
        },
      });

      return mapTemplateRecord(template);
    } catch (error) {
      this.throwTemplateConflict(error, slug);
    }
  }

  async updateTemplate(
    organizationId: string,
    id: string,
    input: TemplateInput,
  ): Promise<Template | null> {
    const existing = await this.client.template.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return null;
    }

    try {
      const documentGeneratedForCurrentVersion = await this.client.document.findFirst({
        where: {
          templateId: id,
          templateVersionMajor: existing.versionMajor,
          templateVersionMinor: existing.versionMinor,
        },
      });

      const nextVersionMinor = documentGeneratedForCurrentVersion
        ? existing.versionMinor + 1
        : existing.versionMinor;

      const template = await this.client.template.update({
        where: { id },
        data: {
          name: input.name,
          content: input.content,
          versionMinor: nextVersionMinor,
        },
      });

      return mapTemplateRecord(template);
    } catch (error) {
      this.throwTemplateConflict(error, existing.slug);
    }
  }

  async deleteTemplate(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.client.template.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return false;
    }

    await this.client.template.delete({ where: { id } });
    return true;
  }

  async listDocumentSummaries(
    organizationId: string,
    freshnessForTemplate: (
      template: Template,
      document: Document,
    ) => DocumentFreshness,
  ): Promise<DocumentSummary[]> {
    const templates = await this.client.template.findMany({
      where: { organizationId },
      include: {
        documents: {
          orderBy: [
            { generatedAt: "desc" },
            { templateVersionMajor: "desc" },
            { templateVersionMinor: "desc" },
          ],
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return templates.map((templateRecord) => {
      const template = mapTemplateRecord(templateRecord);
      const documents = templateRecord.documents.map(mapDocumentRecord);
      const document = documents[0] ?? null;
      const freshness = document
        ? freshnessForTemplate(template, document)
        : null;

      return {
        template,
        document,
        status: freshness?.status ?? "not_generated",
        staleReasons: freshness?.staleReasons ?? [],
        documents,
        publicUrl: null,
      };
    });
  }

  async createDocument(input: {
    template: Template;
    title: string;
    renderedContent: string;
    pdfObjectPath: string | null;
    sourceHash: string;
    sourceFingerprint: Document["sourceFingerprint"];
  }): Promise<Document> {
    try {
      const document = await this.client.document.create({
        data: {
          organizationId: input.template.organizationId,
          templateId: input.template.id,
          title: input.title,
          renderedContent: input.renderedContent,
          pdfObjectPath: input.pdfObjectPath,
          sourceHash: input.sourceHash,
          sourceFingerprint: sourceFingerprintJson(input.sourceFingerprint),
          templateVersionMajor: input.template.versionMajor,
          templateVersionMinor: input.template.versionMinor,
        },
      });

      return mapDocumentRecord(document);
    } catch (error) {
      this.throwDocumentConflict(error, input.template.id);
    }
  }

  async updateDocument(
    id: string,
    input: {
      title: string;
      renderedContent: string;
      pdfObjectPath: string | null;
      sourceHash: string;
      sourceFingerprint: Document["sourceFingerprint"];
      templateVersionMajor: number;
      templateVersionMinor: number;
    },
  ): Promise<Document> {
    const document = await this.client.document.update({
      where: { id },
      data: {
        title: input.title,
        renderedContent: input.renderedContent,
        pdfObjectPath: input.pdfObjectPath,
        sourceHash: input.sourceHash,
        sourceFingerprint: sourceFingerprintJson(input.sourceFingerprint),
        templateVersionMajor: input.templateVersionMajor,
        templateVersionMinor: input.templateVersionMinor,
        generatedAt: new Date(),
      },
    });

    return mapDocumentRecord(document);
  }

  async getDocument(
    organizationId: string,
    id: string,
  ): Promise<Document | null> {
    const document = await this.client.document.findFirst({
      where: { id, organizationId },
    });

    return document ? mapDocumentRecord(document) : null;
  }

  async getDocumentPdfObjectPath(
    organizationId: string,
    id: string,
  ): Promise<string | null> {
    const document = await this.client.document.findFirst({
      where: { id, organizationId },
      select: { pdfObjectPath: true },
    });

    return document?.pdfObjectPath ?? null;
  }

  async getDocumentForTemplate(
    organizationId: string,
    templateId: string,
    versionMajor?: number,
    versionMinor?: number,
  ): Promise<Document | null> {
    const where: any = { organizationId, templateId };
    if (versionMajor !== undefined) {
      where.templateVersionMajor = versionMajor;
    }
    if (versionMinor !== undefined) {
      where.templateVersionMinor = versionMinor;
    }
    const document = await this.client.document.findFirst({
      where,
      orderBy: [
        { generatedAt: "desc" },
        { templateVersionMajor: "desc" },
        { templateVersionMinor: "desc" },
      ],
    });

    return document ? mapDocumentRecord(document) : null;
  }

  async setTemplateVisibility(
    organizationId: string,
    id: string,
    isPublic: boolean,
  ): Promise<Template | null> {
    const existing = await this.client.template.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return null;
    }

    if (isPublic) {
      await this.ensureOrganizationPublicSlug(organizationId);
    }

    const template = await this.client.template.update({
      where: { id },
      data: { isPublic },
    });

    return mapTemplateRecord(template);
  }

  async getOrganizationPublicSlug(
    organizationId: string,
  ): Promise<string | null> {
    const organization = await this.client.organization.findUnique({
      where: { id: organizationId },
      select: { publicSlug: true },
    });

    return organization?.publicSlug ?? null;
  }

  async getPublicDocument(
    orgSlug: string,
    templateSlug: string,
  ): Promise<PublicDocument | null> {
    const template = await this.client.template.findFirst({
      where: {
        slug: templateSlug,
        isPublic: true,
        organization: { publicSlug: orgSlug },
      },
      include: {
        organization: {
          select: { companyName: true, publicSlug: true },
        },
        documents: {
          orderBy: [
            { generatedAt: "desc" },
            { templateVersionMajor: "desc" },
            { templateVersionMinor: "desc" },
          ],
          take: 1,
        },
      },
    });

    const document = template?.documents[0];

    if (!template || !document || !template.organization.publicSlug) {
      return null;
    }

    return {
      organizationName: template.organization.companyName,
      orgSlug: template.organization.publicSlug,
      template: mapTemplateRecord(template),
      document: mapDocumentRecord(document),
    };
  }

  private async ensureOrganizationPublicSlug(organizationId: string) {
    const organization = await this.client.organization.findUnique({
      where: { id: organizationId },
      select: { companyName: true, publicSlug: true },
    });

    if (!organization) {
      throw new ApiError(
        "ORGANIZATION_NOT_FOUND",
        "Organization was not found.",
        404,
      );
    }

    if (organization.publicSlug) {
      return organization.publicSlug;
    }

    const taken = new Set(
      (
        await this.client.organization.findMany({
          where: { publicSlug: { not: null } },
          select: { publicSlug: true },
        })
      ).flatMap((record) => (record.publicSlug ? [record.publicSlug] : [])),
    );
    const slug = uniquePublicSlug(organization.companyName, taken);

    await this.client.organization.update({
      where: { id: organizationId },
      data: { publicSlug: slug },
    });

    return slug;
  }

  private throwTemplateConflict(error: unknown, slug: string): never {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        "TEMPLATE_SLUG_EXISTS",
        "A template with this slug already exists.",
        409,
        { slug },
      );
    }

    throw error;
  }

  private throwDocumentConflict(error: unknown, templateId: string): never {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        "DOCUMENT_ALREADY_EXISTS",
        "A document has already been generated for this template.",
        409,
        { templateId },
      );
    }

    throw error;
  }
}
