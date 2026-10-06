import {
  type Document,
  type DocumentSummary,
  type SystemTemplate,
  type Template,
  type TemplateInput,
} from "@plyco/contracts";

export type DocumentFreshness = {
  status: "current" | "stale";
  staleReasons: string[];
};

export type PublicDocument = {
  organizationName: string;
  orgSlug: string;
  template: Template;
  document: Document;
};

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
    freshnessForTemplate: (
      template: Template,
      document: Document,
    ) => DocumentFreshness,
  ): Promise<DocumentSummary[]>;
  createDocument(input: {
    template: Template;
    title: string;
    renderedContent: string;
    pdfObjectPath: string | null;
    sourceHash: string;
    sourceFingerprint: Document["sourceFingerprint"];
  }): Promise<Document>;
  updateDocument(
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
  setTemplateVisibility(
    organizationId: string,
    id: string,
    isPublic: boolean,
  ): Promise<Template | null>;
  getOrganizationPublicSlug(organizationId: string): Promise<string | null>;
  getPublicDocument(
    orgSlug: string,
    templateSlug: string,
  ): Promise<PublicDocument | null>;
}
