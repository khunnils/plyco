import {
  type Document,
  type DocumentSummary,
  type SystemTemplate,
  type Template,
  type TemplateInput,
} from "@plyco/shared";

export interface DocumentRepository {
  listTemplates(organizationId: string): Promise<Template[]>;
  createTemplateFromSystem(
    organizationId: string,
    systemTemplate: SystemTemplate,
  ): Promise<Template>;
  createTemplate(
    organizationId: string,
    input: TemplateInput,
  ): Promise<Template>;
  updateTemplate(
    organizationId: string,
    id: string,
    input: TemplateInput,
  ): Promise<Template | null>;
  deleteTemplate(organizationId: string, id: string): Promise<boolean>;
  listDocumentSummaries(
    organizationId: string,
    sourceHashForTemplate: (template: Template) => string,
  ): Promise<DocumentSummary[]>;
  createDocument(input: {
    template: Template;
    title: string;
    renderedContent: string;
    pdfObjectPath: string | null;
    sourceHash: string;
  }): Promise<Document>;
  updateDocument(
    id: string,
    input: {
      title: string;
      renderedContent: string;
      pdfObjectPath: string | null;
      sourceHash: string;
      templateVersionMajor: number;
      templateVersionMinor: number;
    },
  ): Promise<Document>;
  getDocumentPdfObjectPath(
    organizationId: string,
    id: string,
  ): Promise<string | null>;
  getDocumentForTemplate(
    organizationId: string,
    templateId: string,
    versionMajor?: number,
    versionMinor?: number,
  ): Promise<Document | null>;
  getDocument(organizationId: string, id: string): Promise<Document | null>;
}
