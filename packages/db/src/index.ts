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
  legalEntityName: string
  website: string
  contactEmail: string
  securityContactEmail: string
  privacyContactEmail: string
  country: string
  address: string
  employeeCount: number
  industries: string[]
  regions: string[]
  handlesPii: boolean
  handlesSensitiveData: boolean
  complianceGoals: string[]
  infrastructureProfile: {
    mfaEnabled: boolean
    encryptedDevicesRequired: boolean
    backupsEnabled: boolean
    centralizedLoggingEnabled: boolean
  } | null
  vendors: Array<{
    providerId: string | null
    systemType: string | null
  }>
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
    description: string
    subjectTypes: string[]
    purposes: string[]
    collectionMethods: string[]
    legalBasis: string[]
    retentionDays: number
    isSensitive: boolean
    isRequired: boolean
    sharedWithThirdParties: boolean
    thirdParties: string[]
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
    legalEntityName: record.legalEntityName,
    website: record.website,
    contactEmail: record.contactEmail,
    securityContactEmail: record.securityContactEmail,
    privacyContactEmail: record.privacyContactEmail,
    country: record.country,
    address: record.address,
    employeeCount: record.employeeCount,
    industries: record.industries,
    regions: record.regions,
    handlesPii: record.handlesPii,
    handlesSensitiveData: record.handlesSensitiveData,
    complianceGoals: record.complianceGoals,
  })
  const infrastructure = infrastructureProfileSchema.parse({
    organizationProviders: record.vendors.flatMap((provider) =>
      provider.providerId && provider.systemType
        ? [
            {
              providerId: provider.providerId,
              systemType: provider.systemType,
            },
          ]
        : [],
    ),
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
      description: dataType.description,
      subjectTypes: dataType.subjectTypes,
      purposes: dataType.purposes,
      collectionMethods: dataType.collectionMethods,
      legalBasis: dataType.legalBasis,
      retentionDays: dataType.retentionDays,
      isSensitive: dataType.isSensitive,
      isRequired: dataType.isRequired,
      sharedWithThirdParties: dataType.sharedWithThirdParties,
      thirdParties: dataType.thirdParties,
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
  countryOfRegistration: string
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
    countryOfRegistration: record.countryOfRegistration,
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
  pdfObjectPath: string | null
  sourceHash: string
  generatedAt: Date
}): Document {
  return documentSchema.parse({
    id: record.id,
    organizationId: record.organizationId,
    templateId: record.templateId,
    title: record.title,
    renderedContent: record.renderedContent,
    hasPdf: Boolean(record.pdfObjectPath),
    sourceHash: record.sourceHash,
    generatedAt: toIsoString(record.generatedAt),
  })
}

export type { PrismaClient }
