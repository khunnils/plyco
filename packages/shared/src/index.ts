import { z } from "zod"

export const dpaStatusSchema = z.enum([
  "not_started",
  "requested",
  "in_review",
  "signed",
  "not_required",
])

export const vendorCriticalitySchema = z.enum(["low", "medium", "high"])

export const vendorDataProcessingLevelSchema = z.enum([
  "none",
  "limited",
  "subprocessor",
])

export const providerSystemTypeSchema = z.enum([
  "auth",
  "source-control",
  "cloud",
  "password-manager",
])

export const organizationProviderSchema = z.object({
  systemType: providerSystemTypeSchema,
  providerId: z.string().trim().min(1),
})

export const storedDataTypeSchema = z.object({
  name: z.string().trim().min(1),
  isSensitive: z.boolean().default(false),
  description: z.string().trim().default(""),
})

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  employeeCount: z.number().int().min(1).max(100000),
  industries: z.array(z.string().trim().min(1)).default([]),
  regions: z.array(z.string().trim().min(1)).default([]),
  handlesPii: z.boolean(),
  handlesSensitiveData: z.boolean(),
  complianceGoals: z.array(z.string().trim().min(1)).default([]),
})

export const infrastructureProfileSchema = z.object({
  organizationProviders: z.array(organizationProviderSchema).default([]),
  mfaEnabled: z.boolean(),
  encryptedDevicesRequired: z.boolean(),
  backupsEnabled: z.boolean(),
  centralizedLoggingEnabled: z.boolean(),
})

export const dataHandlingProfileSchema = z.object({
  dataTypesStored: z.array(storedDataTypeSchema).default([]),
  storesPii: z.boolean(),
  storesHealthcareData: z.boolean(),
  encryptionAtRest: z.boolean(),
  encryptionInTransit: z.boolean(),
  productionDataInDevelopment: z.boolean(),
  retentionPolicyExists: z.boolean(),
})

export const accessProfileSchema = z.object({
  mfaRequired: z.boolean(),
  ssoEnabled: z.boolean(),
  sharedAccountsExist: z.boolean(),
  offboardingProcessExists: z.boolean(),
  accessReviewsPerformed: z.boolean(),
  privilegedAccessRestricted: z.boolean(),
})

const vendorInputBaseSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required"),
  category: z.string().trim().min(1, "Category is required"),
  purpose: z.string().trim().min(1, "Purpose is required"),
  hasSubprocessors: z.boolean(),
  dataProcessingLevel: vendorDataProcessingLevelSchema.default("limited"),
  dataProcessed: z.array(z.string().trim().min(1)).default([]),
  dpaStatus: dpaStatusSchema,
  dataRegions: z.array(z.string().trim().min(1)).default([]),
  criticality: vendorCriticalitySchema,
  owner: z.string().trim().min(1).optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
})

const normalizeVendorDataProcessingNone = <
  T extends z.infer<typeof vendorInputBaseSchema>,
>(
  value: T,
): T =>
  value.dataProcessingLevel === "none"
    ? ({
        ...value,
        hasSubprocessors: false,
        dataProcessed: [],
        dataRegions: [],
        dpaStatus: "not_required",
      } as T)
    : value

export const vendorInputSchema = vendorInputBaseSchema.transform(
  normalizeVendorDataProcessingNone,
)

const vendorStoredBaseSchema = vendorInputBaseSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const vendorSchema = vendorStoredBaseSchema.transform(
  normalizeVendorDataProcessingNone,
)

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  logoUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  category: z.string().trim().min(1).optional(),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  securityCriticality: z.string().trim().min(1).optional(),
  handlesCustomerData: z.boolean(),
})

export const templateSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Template slug must use lowercase letters, numbers, and hyphens",
  )

export const systemTemplateSchema = z.object({
  slug: templateSlugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content: z.string(),
})

export const templateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  slug: templateSlugSchema,
  sourceSystemTemplateSlug: templateSlugSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  slug: templateSlugSchema,
  content: z.string(),
})

export const createTemplateFromSystemSchema = z.object({
  sourceSystemTemplateSlug: templateSlugSchema,
})

export const documentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(1),
  renderedContent: z.string(),
  sourceHash: z.string().min(1),
  generatedAt: z.string().datetime(),
})

export const documentStatusSchema = z.enum([
  "not_generated",
  "current",
  "stale",
])

export const documentSummarySchema = z.object({
  template: templateSchema,
  document: documentSchema.nullable(),
  status: documentStatusSchema,
})

export const createDocumentSchema = z.object({
  templateId: z.string().min(1),
})

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1),
  picture: z.string().url().optional(),
})

export const organizationMembershipRoleSchema = z.enum(["owner", "member"])

export const organizationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  role: organizationMembershipRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const authStateSchema = z.object({
  user: authUserSchema.nullable(),
  organizations: z.array(organizationSummarySchema).default([]),
})

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
})

export const templateCatalogSchema = z.object({
  systemTemplates: z.array(systemTemplateSchema),
  organizationTemplates: z.array(templateSchema),
})

export const organizationSecurityProfileSchema = z.object({
  id: z.string().min(1),
  company: companyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const securityProgramSnapshotSchema = z.object({
  organization: organizationSecurityProfileSchema.nullable(),
  vendors: z.array(vendorSchema),
})

export const structuredErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export type DpaStatus = z.infer<typeof dpaStatusSchema>
export type VendorCriticality = z.infer<typeof vendorCriticalitySchema>
export type VendorDataProcessingLevel = z.infer<
  typeof vendorDataProcessingLevelSchema
>
export type ProviderSystemType = z.infer<typeof providerSystemTypeSchema>
export type OrganizationProvider = z.infer<typeof organizationProviderSchema>
export type StoredDataType = z.infer<typeof storedDataTypeSchema>
export type CompanyProfile = z.infer<typeof companyProfileSchema>
export type InfrastructureProfile = z.infer<typeof infrastructureProfileSchema>
export type DataHandlingProfile = z.infer<typeof dataHandlingProfileSchema>
export type AccessProfile = z.infer<typeof accessProfileSchema>
export type VendorInput = z.infer<typeof vendorInputSchema>
export type Vendor = z.infer<typeof vendorSchema>
export type Provider = z.infer<typeof providerSchema>
export type SystemTemplate = z.infer<typeof systemTemplateSchema>
export type Template = z.infer<typeof templateSchema>
export type TemplateInput = z.infer<typeof templateInputSchema>
export type CreateTemplateFromSystem = z.infer<
  typeof createTemplateFromSystemSchema
>
export type Document = z.infer<typeof documentSchema>
export type DocumentStatus = z.infer<typeof documentStatusSchema>
export type DocumentSummary = z.infer<typeof documentSummarySchema>
export type CreateDocument = z.infer<typeof createDocumentSchema>
export type TemplateCatalog = z.infer<typeof templateCatalogSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type OrganizationMembershipRole = z.infer<
  typeof organizationMembershipRoleSchema
>
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>
export type AuthState = z.infer<typeof authStateSchema>
export type CreateOrganization = z.infer<typeof createOrganizationSchema>
export type OrganizationSecurityProfile = z.infer<
  typeof organizationSecurityProfileSchema
>
export type SecurityProgramSnapshot = z.infer<
  typeof securityProgramSnapshotSchema
>
export type StructuredError = z.infer<typeof structuredErrorSchema>

export const emptyCompanyProfile: CompanyProfile = {
  companyName: "",
  employeeCount: 1,
  industries: [],
  regions: [],
  handlesPii: false,
  handlesSensitiveData: false,
  complianceGoals: [],
}

export const emptyInfrastructureProfile: InfrastructureProfile = {
  organizationProviders: [],
  mfaEnabled: false,
  encryptedDevicesRequired: false,
  backupsEnabled: false,
  centralizedLoggingEnabled: false,
}

export const emptyDataHandlingProfile: DataHandlingProfile = {
  dataTypesStored: [],
  storesPii: false,
  storesHealthcareData: false,
  encryptionAtRest: false,
  encryptionInTransit: false,
  productionDataInDevelopment: false,
  retentionPolicyExists: false,
}

export const emptyAccessProfile: AccessProfile = {
  mfaRequired: false,
  ssoEnabled: false,
  sharedAccountsExist: false,
  offboardingProcessExists: false,
  accessReviewsPerformed: false,
  privilegedAccessRestricted: false,
}
