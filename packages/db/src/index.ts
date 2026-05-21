import { PrismaClient } from "@prisma/client"
import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  privacyProfileSchema,
  serviceProfileSchema,
  documentSchema,
  type OrganizationSecurityProfile,
  type Document,
  type Template,
  type Vendor,
  templateSchema,
  vendorSchema,
} from "@plyco/shared"

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
  serviceProfile?: {
    id: string
    serviceName: string
    serviceDescription: string
    serviceUrl: string
    userTypes: string[]
    customerTypes: string[]
    availabilityRegions: string[]
    childrenDirected: boolean
    minimumUserAge: number
    createdAt: Date
    updatedAt: Date
  } | null
  services?: Array<{
    id: string
    serviceName: string
    serviceDescription: string
    serviceUrl: string
    userTypes: string[]
    customerTypes: string[]
    availabilityRegions: string[]
    childrenDirected: boolean
    minimumUserAge: number
    createdAt: Date
    updatedAt: Date
  }>
  privacyProfile: {
    supportedRights: string[]
    requestMethods: string[]
    responseTimelineDays: number
    identityVerificationRequired: boolean
    authorizedAgentSupported: boolean
    appealProcessExists: boolean
    usesCookies: boolean
    cookieTypes: string[]
    cookieConsentMechanism: string
    doNotTrackResponse: boolean
    globalPrivacyControlSupported: boolean
    sendsMarketingEmails: boolean
    marketingOptOutMethod: string
    transactionalEmailsSent: boolean
    crossBorderTransfers: boolean
    transferMechanisms: string[]
    primaryHostingRegion: string
    dataResidencyOptions: string[]
    sellsOrSharesData: boolean
    doNotSellLink: string
    dpoName: string
    dpoEmail: string
    euRepresentativeName: string
    euRepresentativeAddress: string
    usesAutomatedDecisionMaking: boolean
  } | null
  infrastructureProfile: {
    mfaEnabled: boolean
    encryptedDevicesRequired: boolean
    backupsEnabled: boolean
    centralizedLoggingEnabled: boolean
    atRestAlgorithm: string
    inTransitMinimumTlsVersion: string
    keyManagementProvider: string
    logRetentionDays: number
    securityMonitoringOwner: string
    scanningCadence: string
    patchingSlaCriticalDays: number
    patchingSlaHighDays: number
    incidentResponsePlanExists: boolean
    incidentNotificationTimeline: string
    customerNotificationProcess: string
    incidentResponseLastTestedDate: string
    backupCadence: string
    backupRetentionDays: number
    restoreTestingCadence: string
    vendorReviewRequired: boolean
    vendorReviewCadence: string
    dpaRequiredForProcessors: boolean
  } | null
  vendors: Array<{
    providerId: string | null
    systemType: string | null
    name: string
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
    purposes: string
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
    leastPrivilege: boolean
    roleBasedAccess: boolean
    accessReviewCadence: string
    adminApprovalRequired: boolean
    passwordManagerRequired: boolean
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
      provider.providerId &&
      provider.systemType &&
      ["auth", "source_control", "cloud", "password_manager"].includes(
        provider.systemType,
      )
        ? [
            {
              providerId: provider.providerId,
              systemType: provider.systemType,
              name: provider.name,
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
    atRestAlgorithm: record.infrastructureProfile?.atRestAlgorithm ?? "",
    inTransitMinimumTlsVersion:
      record.infrastructureProfile?.inTransitMinimumTlsVersion ?? "",
    keyManagementProvider:
      record.infrastructureProfile?.keyManagementProvider ?? "",
    logRetentionDays: record.infrastructureProfile?.logRetentionDays ?? 0,
    securityMonitoringOwner:
      record.infrastructureProfile?.securityMonitoringOwner ?? "",
    scanningCadence: record.infrastructureProfile?.scanningCadence ?? "",
    patchingSlaCriticalDays:
      record.infrastructureProfile?.patchingSlaCriticalDays ?? 0,
    patchingSlaHighDays:
      record.infrastructureProfile?.patchingSlaHighDays ?? 0,
    incidentResponsePlanExists:
      record.infrastructureProfile?.incidentResponsePlanExists ?? false,
    incidentNotificationTimeline:
      record.infrastructureProfile?.incidentNotificationTimeline ?? "",
    customerNotificationProcess:
      record.infrastructureProfile?.customerNotificationProcess ?? "",
    incidentResponseLastTestedDate:
      record.infrastructureProfile?.incidentResponseLastTestedDate ?? "",
    backupCadence: record.infrastructureProfile?.backupCadence ?? "",
    backupRetentionDays:
      record.infrastructureProfile?.backupRetentionDays ?? 0,
    restoreTestingCadence:
      record.infrastructureProfile?.restoreTestingCadence ?? "",
    vendorReviewRequired:
      record.infrastructureProfile?.vendorReviewRequired ?? false,
    vendorReviewCadence:
      record.infrastructureProfile?.vendorReviewCadence ?? "",
    dpaRequiredForProcessors:
      record.infrastructureProfile?.dpaRequiredForProcessors ?? false,
  })
  const serviceRecords = record.services ?? (record.serviceProfile ? [record.serviceProfile] : [])
  const services = serviceRecords.flatMap((service) =>
    service
      ? [
          serviceProfileSchema.parse({
            id: service.id,
            serviceName: service.serviceName,
            serviceDescription: service.serviceDescription,
            serviceUrl: service.serviceUrl,
            userTypes: service.userTypes,
            customerTypes: service.customerTypes,
            availabilityRegions: service.availabilityRegions,
            childrenDirected: service.childrenDirected,
            minimumUserAge: service.minimumUserAge,
            createdAt: toIsoString(service.createdAt),
            updatedAt: toIsoString(service.updatedAt),
          }),
        ]
      : [],
  )
  const privacy = privacyProfileSchema.parse({
    supportedRights: record.privacyProfile?.supportedRights ?? [],
    requestMethods: record.privacyProfile?.requestMethods ?? [],
    responseTimelineDays: record.privacyProfile?.responseTimelineDays ?? 0,
    identityVerificationRequired:
      record.privacyProfile?.identityVerificationRequired ?? false,
    authorizedAgentSupported:
      record.privacyProfile?.authorizedAgentSupported ?? false,
    appealProcessExists: record.privacyProfile?.appealProcessExists ?? false,
    usesCookies: record.privacyProfile?.usesCookies ?? false,
    cookieTypes: record.privacyProfile?.cookieTypes ?? [],
    organizationProviders: record.vendors.flatMap((provider) =>
      provider.providerId &&
      (provider.systemType === "analytics" ||
        provider.systemType === "advertising" ||
        provider.systemType === "newsletter")
        ? [
            {
              providerId: provider.providerId,
              systemType: provider.systemType,
              name: provider.name,
            },
          ]
        : [],
    ),
    cookieConsentMechanism:
      record.privacyProfile?.cookieConsentMechanism ?? "",
    doNotTrackResponse: record.privacyProfile?.doNotTrackResponse ?? false,
    globalPrivacyControlSupported:
      record.privacyProfile?.globalPrivacyControlSupported ?? false,
    sendsMarketingEmails: record.privacyProfile?.sendsMarketingEmails ?? false,
    marketingOptOutMethod: record.privacyProfile?.marketingOptOutMethod ?? "",
    transactionalEmailsSent:
      record.privacyProfile?.transactionalEmailsSent ?? false,
    crossBorderTransfers: record.privacyProfile?.crossBorderTransfers ?? false,
    transferMechanisms: record.privacyProfile?.transferMechanisms ?? [],
    primaryHostingRegion: record.privacyProfile?.primaryHostingRegion ?? "",
    dataResidencyOptions: record.privacyProfile?.dataResidencyOptions ?? [],
    sellsOrSharesData: record.privacyProfile?.sellsOrSharesData ?? false,
    doNotSellLink: record.privacyProfile?.doNotSellLink ?? "",
    dpoName: record.privacyProfile?.dpoName ?? "",
    dpoEmail: record.privacyProfile?.dpoEmail ?? "",
    euRepresentativeName: record.privacyProfile?.euRepresentativeName ?? "",
    euRepresentativeAddress: record.privacyProfile?.euRepresentativeAddress ?? "",
    usesAutomatedDecisionMaking: record.privacyProfile?.usesAutomatedDecisionMaking ?? false,
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
    leastPrivilege: record.accessProfile?.leastPrivilege ?? false,
    roleBasedAccess: record.accessProfile?.roleBasedAccess ?? false,
    accessReviewCadence: record.accessProfile?.accessReviewCadence ?? "",
    adminApprovalRequired:
      record.accessProfile?.adminApprovalRequired ?? false,
    passwordManagerRequired:
      record.accessProfile?.passwordManagerRequired ?? false,
  })

  return {
    id: record.id,
    company,
    services,
    privacy,
    infrastructure,
    dataHandling,
    access,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  }
}

export function mapVendorRecord(record: {
  id: string
  serviceId: string | null
  service?: {
    serviceName: string
  } | null
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
    serviceId: record.serviceId ?? "",
    serviceName: record.service?.serviceName ?? "",
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
  policyEffectiveDate: string
  policyLastReviewedDate: string
  policyVersion: string
  policyOwnerUserId: string | null
  policyApproverUserId: string | null
  policyReviewCadence: string
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
    policyEffectiveDate: record.policyEffectiveDate,
    policyLastReviewedDate: record.policyLastReviewedDate,
    policyVersion: record.policyVersion,
    policyOwnerUserId: record.policyOwnerUserId ?? "",
    policyApproverUserId: record.policyApproverUserId ?? "",
    policyReviewCadence: record.policyReviewCadence,
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
