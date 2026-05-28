import {
  type Document,
  type DocumentSummary,
  type SystemTemplate,
  type Template,
  type TemplateInput,
} from "@plyco/shared";

import { ApiError } from "../../infrastructure/errors.js";
import { type OrganizationRepository } from "../organizations/repository.js";
import { type DocumentRepository } from "./repository.js";

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class InMemoryDocumentRepository implements DocumentRepository {
  private templates = new Map<string, Template>();
  private documents = new Map<string, Document>();
  private documentPdfObjectPaths = new Map<string, string>();

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async listTemplates(organizationId: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      (template) => template.organizationId === organizationId,
    );
  }

  async createTemplateFromSystem(
    organizationId: string,
    systemTemplate: SystemTemplate,
  ): Promise<Template> {
    const timestamp = now();
    const existing = Array.from(this.templates.values()).find(
      (template) =>
        template.organizationId === organizationId &&
        template.slug === systemTemplate.slug,
    );

    if (existing) {
      throw new ApiError(
        "TEMPLATE_SLUG_EXISTS",
        "A template with this slug already exists.",
        409,
        { slug: systemTemplate.slug },
      );
    }

    const template: Template = {
      id: newId("template"),
      organizationId,
      name: systemTemplate.name,
      slug: systemTemplate.slug,
      sourceSystemTemplateSlug: systemTemplate.slug,
      content: systemTemplate.content,
      versionMajor: 1,
      versionMinor: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.templates.set(template.id, template);
    return template;
  }

  async createTemplate(
    organizationId: string,
    input: TemplateInput,
  ): Promise<Template> {
    const timestamp = now();
    const slug = slugify(input.name) || "template";
    const existing = Array.from(this.templates.values()).find(
      (template) =>
        template.organizationId === organizationId &&
        template.slug === slug,
    );

    if (existing) {
      throw new ApiError(
        "TEMPLATE_SLUG_EXISTS",
        "A template with this slug already exists.",
        409,
        { slug },
      );
    }

    const template: Template = {
      id: newId("template"),
      organizationId,
      sourceSystemTemplateSlug: null,
      name: input.name,
      slug: slug,
      content: input.content,
      versionMajor: 1,
      versionMinor: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(
    organizationId: string,
    id: string,
    input: TemplateInput,
  ): Promise<Template | null> {
    const currentTemplate = this.templates.get(id);

    if (!currentTemplate || currentTemplate.organizationId !== organizationId) {
      return null;
    }

    const hasDocumentForCurrentVersion = Array.from(this.documents.values()).some(
      (doc) =>
        doc.templateId === id &&
        doc.templateVersionMajor === currentTemplate.versionMajor &&
        doc.templateVersionMinor === currentTemplate.versionMinor,
    );

    const nextVersionMinor = hasDocumentForCurrentVersion
      ? currentTemplate.versionMinor + 1
      : currentTemplate.versionMinor;

    const template: Template = {
      ...currentTemplate,
      name: input.name,
      content: input.content,
      versionMinor: nextVersionMinor,
      updatedAt: now(),
    };

    this.templates.set(id, template);
    return template;
  }

  async deleteTemplate(organizationId: string, id: string): Promise<boolean> {
    const currentTemplate = this.templates.get(id);

    if (!currentTemplate || currentTemplate.organizationId !== organizationId) {
      return false;
    }

    const deleted = this.templates.delete(id);

    if (deleted) {
      for (const [documentId, document] of this.documents) {
        if (document.templateId === id) {
          this.documents.delete(documentId);
          this.documentPdfObjectPaths.delete(documentId);
        }
      }
    }

    return deleted;
  }

  async listDocumentSummaries(
    organizationId: string,
    sourceHashForTemplate: (template: Template) => string,
  ): Promise<DocumentSummary[]> {
    return Array.from(this.templates.values())
      .filter((template) => template.organizationId === organizationId)
      .map((template) => {
        const documents = Array.from(this.documents.values())
          .filter(
            (currentDocument) =>
              currentDocument.organizationId === organizationId &&
              currentDocument.templateId === template.id,
          )
          .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

        const document = documents[0] ?? null;

        return {
          template,
          document,
          status: !document
            ? "not_generated"
            : document.sourceHash === sourceHashForTemplate(template)
              ? "current"
              : "stale",
          documents,
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
    const existingDocument = Array.from(this.documents.values()).find(
      (document) =>
        document.templateId === input.template.id &&
        document.templateVersionMajor === input.template.versionMajor &&
        document.templateVersionMinor === input.template.versionMinor,
    );

    if (existingDocument) {
      throw new ApiError(
        "DOCUMENT_ALREADY_EXISTS",
        "A document has already been generated for this template version.",
        409,
        { templateId: input.template.id },
      );
    }

    const document: Document = {
      id: newId("document"),
      organizationId: input.template.organizationId,
      templateId: input.template.id,
      title: input.title,
      renderedContent: input.renderedContent,
      hasPdf: Boolean(input.pdfObjectPath),
      sourceHash: input.sourceHash,
      templateVersionMajor: input.template.versionMajor,
      templateVersionMinor: input.template.versionMinor,
      generatedAt: now(),
    };

    this.documents.set(document.id, document);

    if (input.pdfObjectPath) {
      this.documentPdfObjectPaths.set(document.id, input.pdfObjectPath);
    }

    return document;
  }

  async updateDocument(
    id: string,
    input: {
      title: string;
      renderedContent: string;
      pdfObjectPath: string | null;
      sourceHash: string;
      templateVersionMajor: number;
      templateVersionMinor: number;
    },
  ): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error("Document not found");
    }

    const updated: Document = {
      ...document,
      title: input.title,
      renderedContent: input.renderedContent,
      hasPdf: Boolean(input.pdfObjectPath),
      sourceHash: input.sourceHash,
      templateVersionMajor: input.templateVersionMajor,
      templateVersionMinor: input.templateVersionMinor,
      generatedAt: now(),
    };

    this.documents.set(id, updated);

    if (input.pdfObjectPath) {
      this.documentPdfObjectPaths.set(id, input.pdfObjectPath);
    } else {
      this.documentPdfObjectPaths.delete(id);
    }

    return updated;
  }

  async getDocument(
    organizationId: string,
    id: string,
  ): Promise<Document | null> {
    const document = this.documents.get(id) ?? null;

    return document?.organizationId === organizationId ? document : null;
  }

  async getDocumentPdfObjectPath(
    organizationId: string,
    id: string,
  ): Promise<string | null> {
    const document = await this.getDocument(organizationId, id);

    return document ? (this.documentPdfObjectPaths.get(id) ?? null) : null;
  }

  async getDocumentForTemplate(
    organizationId: string,
    templateId: string,
    versionMajor?: number,
    versionMinor?: number,
  ): Promise<Document | null> {
    const matched = Array.from(this.documents.values())
      .filter(
        (currentDocument) =>
          currentDocument.organizationId === organizationId &&
          currentDocument.templateId === templateId &&
          (versionMajor === undefined || currentDocument.templateVersionMajor === versionMajor) &&
          (versionMinor === undefined || currentDocument.templateVersionMinor === versionMinor),
      )
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

    return matched[0] ?? null;
  }
}
