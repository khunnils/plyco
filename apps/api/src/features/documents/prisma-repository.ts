import {
  mapDocumentRecord,
  mapTemplateRecord,
  prisma,
  type PrismaClient,
} from "@plyco/db";
import {
  type Document,
  type DocumentSummary,
  type SystemTemplate,
  type Template,
  type TemplateInput,
} from "@plyco/shared";

import { ApiError } from "../../errors.js";
import { type OrganizationRepository } from "../organizations/repository.js";
import { type DocumentRepository } from "./repository.js";

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
          policyEffectiveDate: "",
          policyLastReviewedDate: "",
          policyVersion: "",
          policyOwnerUserId: null,
          policyApproverUserId: null,
          policyReviewCadence: "",
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
    try {
      const template = await this.client.template.create({
        data: {
          organizationId,
          name: input.name,
          slug: input.slug,
          sourceSystemTemplateSlug: null,
          content: input.content,
          policyEffectiveDate: input.policyEffectiveDate,
          policyLastReviewedDate: input.policyLastReviewedDate,
          policyVersion: input.policyVersion,
          policyOwnerUserId: input.policyOwnerUserId || null,
          policyApproverUserId: input.policyApproverUserId || null,
          policyReviewCadence: input.policyReviewCadence,
        },
      });

      return mapTemplateRecord(template);
    } catch (error) {
      this.throwTemplateConflict(error, input.slug);
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
      const template = await this.client.template.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          content: input.content,
          policyEffectiveDate: input.policyEffectiveDate,
          policyLastReviewedDate: input.policyLastReviewedDate,
          policyVersion: input.policyVersion,
          policyOwnerUserId: input.policyOwnerUserId || null,
          policyApproverUserId: input.policyApproverUserId || null,
          policyReviewCadence: input.policyReviewCadence,
        },
      });

      return mapTemplateRecord(template);
    } catch (error) {
      this.throwTemplateConflict(error, input.slug);
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
    sourceHashForTemplate: (template: Template) => string,
  ): Promise<DocumentSummary[]> {
    const templates = await this.client.template.findMany({
      where: { organizationId },
      include: { documents: true },
      orderBy: { createdAt: "asc" },
    });

    return templates.map((templateRecord) => {
      const template = mapTemplateRecord(templateRecord);
      const documentRecord = templateRecord.documents[0] ?? null;
      const document = documentRecord
        ? mapDocumentRecord(documentRecord)
        : null;

      return {
        template,
        document,
        status: !document
          ? "not_generated"
          : document.sourceHash === sourceHashForTemplate(template)
            ? "current"
            : "stale",
      };
    });
  }

  async createDocument(input: {
    template: Template;
    title: string;
    renderedContent: string;
    pdfObjectPath: string | null;
    sourceHash: string;
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
        },
      });

      return mapDocumentRecord(document);
    } catch (error) {
      this.throwDocumentConflict(error, input.template.id);
    }
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
  ): Promise<Document | null> {
    const document = await this.client.document.findFirst({
      where: { organizationId, templateId },
    });

    return document ? mapDocumentRecord(document) : null;
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
