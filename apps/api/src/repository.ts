import {
  type OrganizationSecurityProfile,
  type Document,
  type DocumentSummary,
  type SecurityProgramSnapshot,
  type SystemTemplate,
  type Template,
  type TemplateInput,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import { ApiError } from "./errors.js"

export type SecurityProfileInput = Pick<
  OrganizationSecurityProfile,
  "company" | "infrastructure" | "dataHandling" | "access"
>

export interface SecurityProfileRepository {
  getSnapshot(): Promise<SecurityProgramSnapshot>
  upsertProfile(
    input: SecurityProfileInput,
  ): Promise<OrganizationSecurityProfile>
  listVendors(): Promise<Vendor[]>
  createVendor(input: VendorInput): Promise<Vendor>
  updateVendor(id: string, input: VendorInput): Promise<Vendor | null>
  deleteVendor(id: string): Promise<boolean>
  listTemplates(): Promise<Template[]>
  createTemplateFromSystem(systemTemplate: SystemTemplate): Promise<Template>
  updateTemplate(id: string, input: TemplateInput): Promise<Template | null>
  deleteTemplate(id: string): Promise<boolean>
  listDocumentSummaries(
    sourceHashForTemplate: (template: Template) => string,
  ): Promise<DocumentSummary[]>
  createDocument(input: {
    template: Template
    title: string
    renderedContent: string
    sourceHash: string
  }): Promise<Document>
  getDocument(id: string): Promise<Document | null>
}

function now() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export class InMemorySecurityProfileRepository implements SecurityProfileRepository {
  private organization: OrganizationSecurityProfile | null = null
  private vendors = new Map<string, Vendor>()
  private templates = new Map<string, Template>()
  private documents = new Map<string, Document>()

  async getSnapshot(): Promise<SecurityProgramSnapshot> {
    return {
      organization: this.organization,
      vendors: Array.from(this.vendors.values()),
    }
  }

  async upsertProfile(
    input: SecurityProfileInput,
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now()
    const organization: OrganizationSecurityProfile = {
      id: this.organization?.id ?? newId("org"),
      ...input,
      createdAt: this.organization?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    this.organization = organization
    return organization
  }

  async listVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values())
  }

  async createVendor(input: VendorInput): Promise<Vendor> {
    const timestamp = now()
    const dataProcessed = this.validVendorDataTypeNames(input)
    const vendor: Vendor = {
      id: newId("vendor"),
      ...input,
      dataProcessed,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.vendors.set(vendor.id, vendor)
    return vendor
  }

  async updateVendor(id: string, input: VendorInput): Promise<Vendor | null> {
    const currentVendor = this.vendors.get(id)

    if (!currentVendor) {
      return null
    }

    const dataProcessed = this.validVendorDataTypeNames(input)
    const vendor: Vendor = {
      id,
      ...input,
      dataProcessed,
      createdAt: currentVendor.createdAt,
      updatedAt: now(),
    }

    this.vendors.set(id, vendor)
    return vendor
  }

  async deleteVendor(id: string): Promise<boolean> {
    return this.vendors.delete(id)
  }

  async listTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
  }

  async createTemplateFromSystem(
    systemTemplate: SystemTemplate,
  ): Promise<Template> {
    const timestamp = now()
    const organizationId = this.getOrCreateOrganizationId()
    const existing = Array.from(this.templates.values()).find(
      (template) =>
        template.organizationId === organizationId &&
        template.slug === systemTemplate.slug,
    )

    if (existing) {
      throw new ApiError(
        "TEMPLATE_SLUG_EXISTS",
        "A template with this slug already exists.",
        409,
        { slug: systemTemplate.slug },
      )
    }

    const template: Template = {
      id: newId("template"),
      organizationId,
      name: systemTemplate.name,
      slug: systemTemplate.slug,
      sourceSystemTemplateSlug: systemTemplate.slug,
      content: systemTemplate.content,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.templates.set(template.id, template)
    return template
  }

  async updateTemplate(
    id: string,
    input: TemplateInput,
  ): Promise<Template | null> {
    const currentTemplate = this.templates.get(id)

    if (!currentTemplate) {
      return null
    }

    const duplicate = Array.from(this.templates.values()).find(
      (template) =>
        template.id !== id &&
        template.organizationId === currentTemplate.organizationId &&
        template.slug === input.slug,
    )

    if (duplicate) {
      throw new ApiError(
        "TEMPLATE_SLUG_EXISTS",
        "A template with this slug already exists.",
        409,
        { slug: input.slug },
      )
    }

    const template: Template = {
      ...currentTemplate,
      ...input,
      updatedAt: now(),
    }

    this.templates.set(id, template)
    return template
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const deleted = this.templates.delete(id)

    if (deleted) {
      for (const [documentId, document] of this.documents) {
        if (document.templateId === id) {
          this.documents.delete(documentId)
        }
      }
    }

    return deleted
  }

  async listDocumentSummaries(
    sourceHashForTemplate: (template: Template) => string,
  ): Promise<DocumentSummary[]> {
    return Array.from(this.templates.values()).map((template) => {
      const document =
        Array.from(this.documents.values()).find(
          (currentDocument) => currentDocument.templateId === template.id,
        ) ?? null

      return {
        template,
        document,
        status: !document
          ? "not_generated"
          : document.sourceHash === sourceHashForTemplate(template)
            ? "current"
            : "stale",
      }
    })
  }

  async createDocument(input: {
    template: Template
    title: string
    renderedContent: string
    sourceHash: string
  }): Promise<Document> {
    const existingDocument = Array.from(this.documents.values()).find(
      (document) => document.templateId === input.template.id,
    )

    if (existingDocument) {
      throw new ApiError(
        "DOCUMENT_ALREADY_EXISTS",
        "A document has already been generated for this template.",
        409,
        { templateId: input.template.id },
      )
    }

    const document: Document = {
      id: newId("document"),
      organizationId: input.template.organizationId,
      templateId: input.template.id,
      title: input.title,
      renderedContent: input.renderedContent,
      sourceHash: input.sourceHash,
      generatedAt: now(),
    }

    this.documents.set(document.id, document)
    return document
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) ?? null
  }

  private validVendorDataTypeNames(input: VendorInput) {
    if (input.dataProcessingLevel === "none") {
      return []
    }

    const requestedNames = Array.from(new Set(input.dataProcessed))

    if (requestedNames.length === 0) {
      return []
    }

    const organizationDataTypeNames = new Set(
      this.organization?.dataHandling.dataTypesStored.map(
        (dataType) => dataType.name,
      ) ?? [],
    )
    const missingNames = requestedNames.filter(
      (name) => !organizationDataTypeNames.has(name),
    )

    if (missingNames.length > 0) {
      throw new ApiError(
        "VENDOR_DATA_TYPE_NOT_FOUND",
        "Vendor data processed must reference data types stored on the organization.",
        400,
        { dataProcessed: missingNames },
      )
    }

    return requestedNames
  }

  private getOrCreateOrganizationId() {
    if (!this.organization) {
      const timestamp = now()

      this.organization = {
        id: newId("org"),
        company: {
          companyName: "Untitled company",
          employeeCount: 1,
          industries: [],
          regions: [],
          handlesPii: false,
          handlesSensitiveData: false,
          complianceGoals: [],
        },
        infrastructure: {
          cloudProviders: [],
          sourceControlProvider: "",
          authProvider: "",
          passwordManager: "",
          mfaEnabled: false,
          encryptedDevicesRequired: false,
          backupsEnabled: false,
          centralizedLoggingEnabled: false,
        },
        dataHandling: {
          dataTypesStored: [],
          storesPii: false,
          storesHealthcareData: false,
          encryptionAtRest: false,
          encryptionInTransit: false,
          productionDataInDevelopment: false,
          retentionPolicyExists: false,
        },
        access: {
          mfaRequired: false,
          ssoEnabled: false,
          sharedAccountsExist: false,
          offboardingProcessExists: false,
          accessReviewsPerformed: false,
          privilegedAccessRestricted: false,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    }

    return this.organization.id
  }
}
