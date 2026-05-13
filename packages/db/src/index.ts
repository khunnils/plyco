import { PrismaClient } from "@prisma/client"
import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  documentSchema,
  type OrganizationSecurityProfile,
  type Document,
  type Template,
  type Vendor,
  templateSchema,
  vendorSchema,
} from "@complyflow/shared"

export const prisma = new PrismaClient()

function toIsoString(value: Date) {
  return value.toISOString()
}

export function mapOrganizationRecord(record: {
  id: string
  companyName: string
  employeeCount: number
  industries: string[]
  regions: string[]
  handlesPii: boolean
  handlesSensitiveData: boolean
  complianceGoals: string[]
  infrastructureProfile: {
    cloudProviders: string[]
    sourceControlProvider: string | null
    authProvider: string | null
    passwordManager: string | null
    mfaEnabled: boolean
    encryptedDevicesRequired: boolean
    backupsEnabled: boolean
    centralizedLoggingEnabled: boolean
  } | null
  dataHandlingProfile: {
    storesPii: boolean
    storesHealthcareData: boolean
    encryptionAtRest: boolean
    encryptionInTransit: boolean
    productionDataInDevelopment: boolean
    retentionPolicyExists: boolean
  } | null
  dataTypes: Array<{
    name: string
    isSensitive: boolean
    description: string
  }>
  accessProfile: {
    mfaRequired: boolean
    ssoEnabled: boolean
    sharedAccountsExist: boolean
    offboardingProcessExists: boolean
    accessReviewsPerformed: boolean
    privilegedAccessRestricted: boolean
  } | null
  createdAt: Date
  updatedAt: Date
}): OrganizationSecurityProfile {
  const company = companyProfileSchema.parse({
    companyName: record.companyName,
    employeeCount: record.employeeCount,
    industries: record.industries,
    regions: record.regions,
    handlesPii: record.handlesPii,
    handlesSensitiveData: record.handlesSensitiveData,
    complianceGoals: record.complianceGoals,
  })
  const infrastructure = infrastructureProfileSchema.parse({
    cloudProviders: record.infrastructureProfile?.cloudProviders ?? [],
    sourceControlProvider:
      record.infrastructureProfile?.sourceControlProvider ?? "",
    authProvider: record.infrastructureProfile?.authProvider ?? "",
    passwordManager: record.infrastructureProfile?.passwordManager ?? "",
    mfaEnabled: record.infrastructureProfile?.mfaEnabled ?? false,
    encryptedDevicesRequired:
      record.infrastructureProfile?.encryptedDevicesRequired ?? false,
    backupsEnabled: record.infrastructureProfile?.backupsEnabled ?? false,
    centralizedLoggingEnabled:
      record.infrastructureProfile?.centralizedLoggingEnabled ?? false,
  })
  const dataHandling = dataHandlingProfileSchema.parse({
    dataTypesStored: record.dataTypes.map((dataType) => ({
      name: dataType.name,
      isSensitive: dataType.isSensitive,
      description: dataType.description,
    })),
    storesPii: record.dataHandlingProfile?.storesPii ?? false,
    storesHealthcareData:
      record.dataHandlingProfile?.storesHealthcareData ?? false,
    encryptionAtRest: record.dataHandlingProfile?.encryptionAtRest ?? false,
    encryptionInTransit:
      record.dataHandlingProfile?.encryptionInTransit ?? false,
    productionDataInDevelopment:
      record.dataHandlingProfile?.productionDataInDevelopment ?? false,
    retentionPolicyExists:
      record.dataHandlingProfile?.retentionPolicyExists ?? false,
  })
  const access = accessProfileSchema.parse({
    mfaRequired: record.accessProfile?.mfaRequired ?? false,
    ssoEnabled: record.accessProfile?.ssoEnabled ?? false,
    sharedAccountsExist: record.accessProfile?.sharedAccountsExist ?? false,
    offboardingProcessExists:
      record.accessProfile?.offboardingProcessExists ?? false,
    accessReviewsPerformed:
      record.accessProfile?.accessReviewsPerformed ?? false,
    privilegedAccessRestricted:
      record.accessProfile?.privilegedAccessRestricted ?? false,
  })

  return {
    id: record.id,
    company,
    infrastructure,
    dataHandling,
    access,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  }
}

export function mapVendorRecord(record: {
  id: string
  name: string
  category: string
  purpose: string
  hasSubprocessors: boolean
  dataProcessingLevel: string
  dpaStatus: string
  dataRegions: string[]
  dataTypes: Array<{
    organizationDataType: {
      name: string
    }
  }>
  criticality: string
  owner: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}): Vendor {
  return vendorSchema.parse({
    id: record.id,
    name: record.name,
    category: record.category,
    purpose: record.purpose,
    hasSubprocessors: record.hasSubprocessors,
    dataProcessingLevel: record.dataProcessingLevel,
    dataProcessed: record.dataTypes.map(
      (dataType) => dataType.organizationDataType.name,
    ),
    dpaStatus: record.dpaStatus,
    dataRegions: record.dataRegions,
    criticality: record.criticality,
    owner: record.owner ?? "",
    notes: record.notes ?? "",
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  })
}

export function mapTemplateRecord(record: {
  id: string
  organizationId: string
  name: string
  slug: string
  sourceSystemTemplateSlug: string
  content: string
  createdAt: Date
  updatedAt: Date
}): Template {
  return templateSchema.parse({
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    slug: record.slug,
    sourceSystemTemplateSlug: record.sourceSystemTemplateSlug,
    content: record.content,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  })
}

export function mapDocumentRecord(record: {
  id: string
  organizationId: string
  templateId: string
  title: string
  renderedContent: string
  sourceHash: string
  generatedAt: Date
}): Document {
  return documentSchema.parse({
    id: record.id,
    organizationId: record.organizationId,
    templateId: record.templateId,
    title: record.title,
    renderedContent: record.renderedContent,
    sourceHash: record.sourceHash,
    generatedAt: toIsoString(record.generatedAt),
  })
}

export type { PrismaClient }
