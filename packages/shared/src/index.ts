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
  cloudProviders: z.array(z.string().trim().min(1)).default([]),
  sourceControlProvider: z.string().trim().min(1).optional().or(z.literal("")),
  authProvider: z.string().trim().min(1).optional().or(z.literal("")),
  passwordManager: z.string().trim().min(1).optional().or(z.literal("")),
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
  dataProcessingLevel:
    vendorDataProcessingLevelSchema.default("limited"),
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

export const vendorSchema =
  vendorStoredBaseSchema.transform(normalizeVendorDataProcessingNone)

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  logoUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  category: z.string().trim().min(1).optional(),
  securityCriticality: z.string().trim().min(1).optional(),
  handlesCustomerData: z.boolean(),
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
export type StoredDataType = z.infer<typeof storedDataTypeSchema>
export type CompanyProfile = z.infer<typeof companyProfileSchema>
export type InfrastructureProfile = z.infer<typeof infrastructureProfileSchema>
export type DataHandlingProfile = z.infer<typeof dataHandlingProfileSchema>
export type AccessProfile = z.infer<typeof accessProfileSchema>
export type VendorInput = z.infer<typeof vendorInputSchema>
export type Vendor = z.infer<typeof vendorSchema>
export type Provider = z.infer<typeof providerSchema>
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
  cloudProviders: [],
  sourceControlProvider: "",
  authProvider: "",
  passwordManager: "",
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
