import {
  isComplianceFieldVisible,
  type OrganizationProvider,
  type ServiceProviderUsage,
  type StoredDataType,
} from "@plyco/shared"

import { type ProfileDraft } from "@/features/company/types/company"

export type ProgressMetric = {
  completedFields: number
  totalFields: number
  percent: number
}

export type ProgressSection = ProgressMetric & {
  title: string
}

export type ProgressGroup = ProgressMetric & {
  completedSections: number
  totalSections: number
  sections: ProgressSection[]
}

export type ProgressItem = ProgressGroup & {
  id: string
  title: string
  href?: string
}

export type DashboardProgress = {
  overall: ProgressMetric & {
    completedSections: number
    totalSections: number
  }
  profile: ProgressGroup
  privacy: ProgressGroup
  infrastructure: ProgressGroup
  access: ProgressGroup
  services: ProgressItem[]
  data: {
    general: ProgressSection
    dataTypes: ProgressSection[]
  }
  vendors: ProgressItem[]
}

type ReadinessField = {
  label: string
  value: unknown
  zeroMeansUnset?: boolean
}

export const isAnswered = (
  value: unknown,
  options: { zeroMeansUnset?: boolean } = {}
) => {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return options.zeroMeansUnset ? value !== 0 : true
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

const percent = (completedFields: number, totalFields: number) =>
  totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100)

export const sectionProgress = (
  title: string,
  fields: ReadinessField[]
): ProgressSection => {
  const completedFields = fields.filter((field) =>
    isAnswered(field.value, { zeroMeansUnset: field.zeroMeansUnset })
  ).length
  const totalFields = fields.length

  return {
    title,
    completedFields,
    totalFields,
    percent: percent(completedFields, totalFields),
  }
}

export const groupProgress = (sections: ProgressSection[]): ProgressGroup => {
  const completedFields = sections.reduce(
    (total, section) => total + section.completedFields,
    0
  )
  const totalFields = sections.reduce(
    (total, section) => total + section.totalFields,
    0
  )
  const completedSections = sections.filter(
    (section) =>
      section.totalFields > 0 && section.completedFields === section.totalFields
  ).length

  return {
    completedFields,
    totalFields,
    percent: percent(completedFields, totalFields),
    completedSections,
    totalSections: sections.length,
    sections,
  }
}

const field = (
  label: string,
  value: unknown,
  zeroMeansUnset = false
): ReadinessField => ({
  label,
  value,
  zeroMeansUnset,
})

const providersForType = (
  providers: Array<{ systemType: string }>,
  systemType: string
) => providers.filter((provider) => provider.systemType === systemType)

export const profileProgress = (profile: ProfileDraft) =>
  groupProgress([
    sectionProgress("Company details", [
      field("Company name", profile.company.companyName),
      field("Legal entity", profile.company.legalEntityName),
      field("Website", profile.company.website),
      field("Country", profile.company.country),
      field("Address", profile.company.address),
    ]),
    sectionProgress("Operations", [
      field("Employees", profile.company.employeeCount),
      field("Industries", profile.company.industries),
      field("Regions", profile.company.regions),
      field("Compliance goals", profile.company.complianceGoals),
    ]),
    sectionProgress("Contacts", [
      field("Contact email", profile.company.contactEmail),
      field("Security contact", profile.company.securityContactEmail),
      field("Privacy contact", profile.company.privacyContactEmail),
    ]),
    sectionProgress("Data profile", [
      field("Handles PII", profile.company.handlesPii),
      field("Sensitive data", profile.company.handlesSensitiveData),
    ]),
  ])

export const privacyProgress = (profile: ProfileDraft) => {
  const privacy = profile.privacy
  const newsletterProviders = privacy.organizationProviders.filter(
    (provider) => provider.systemType === "newsletter"
  )
  const showPrivacyRepresentation = isComplianceFieldVisible(
    "privacy.dpoStatus",
    profile.company.complianceGoals
  )

  return groupProgress([
    sectionProgress("Privacy Rights & Request Handling", [
      field("Supported rights", privacy.supportedRights),
      field("Request methods", privacy.requestMethods),
      field("Response timeline status", privacy.responseTimelineDaysStatus),
      ...(privacy.responseTimelineDaysStatus === "defined"
        ? [field("Response timeline days", privacy.responseTimelineDays, true)]
        : []),
      field(
        "Identity verification required",
        privacy.identityVerificationRequired
      ),
      field("Authorized agent supported", privacy.authorizedAgentSupported),
      field("Appeal process exists", privacy.appealProcessExists),
    ]),
    sectionProgress("Marketing & Communications", [
      field("Marketing emails", privacy.sendsMarketingEmails),
      ...(privacy.sendsMarketingEmails
        ? [
            field("Marketing opt-out method", privacy.marketingOptOutMethod),
            field("Newsletter provider", newsletterProviders),
          ]
        : []),
      field("Transactional emails sent", privacy.transactionalEmailsSent),
    ]),
    sectionProgress("International Transfers", [
      field("Cross-border transfers", privacy.crossBorderTransfers),
      ...(privacy.crossBorderTransfers
        ? [field("Transfer mechanisms", privacy.transferMechanisms)]
        : []),
    ]),
    sectionProgress("Compliance & Disclosures", [
      field("Sells or shares data", privacy.sellsOrSharesData),
      ...(privacy.sellsOrSharesData
        ? [field("Do Not Sell link", privacy.doNotSellLink)]
        : []),
      field("Automated decision making", privacy.usesAutomatedDecisionMaking),
    ]),
    ...(showPrivacyRepresentation
      ? [
          sectionProgress("Privacy Officers & Representation", [
            field("DPO status", privacy.dpoStatus),
            ...(privacy.dpoStatus === "appointed"
              ? [
                  field("DPO name", privacy.dpoName),
                  field("DPO email", privacy.dpoEmail),
                ]
              : []),
            field("EU representative status", privacy.euRepresentativeStatus),
            ...(privacy.euRepresentativeStatus === "appointed"
              ? [
                  field("EU representative", privacy.euRepresentativeName),
                  field(
                    "EU representative address",
                    privacy.euRepresentativeAddress
                  ),
                ]
              : []),
          ]),
        ]
      : []),
  ])
}

export const infrastructureProgress = (profile: ProfileDraft) => {
  const infrastructure = profile.infrastructure

  return groupProgress([
    sectionProgress("Infrastructure Providers", [
      field(
        "Cloud providers",
        providersForType(infrastructure.organizationProviders, "cloud")
      ),
      field(
        "Code repository",
        providersForType(infrastructure.organizationProviders, "source_control")
      ),
      field(
        "Login provider",
        providersForType(infrastructure.organizationProviders, "auth")
      ),
      field(
        "Password manager",
        providersForType(
          infrastructure.organizationProviders,
          "password_manager"
        )
      ),
      field("MFA enabled", infrastructure.mfaEnabled),
      field("Work devices encrypted", infrastructure.encryptedDevicesRequired),
    ]),
    sectionProgress("Encryption", [
      field("Stored data encryption", infrastructure.atRestAlgorithm),
      field("Minimum TLS version", infrastructure.inTransitMinimumTlsVersion),
      field("Key management", infrastructure.keyManagementProvider),
    ]),
    sectionProgress("Logging & Monitoring", [
      field(
        "Centralized logging enabled",
        infrastructure.centralizedLoggingEnabled
      ),
      field("Log retention status", infrastructure.logRetentionDaysStatus),
      field("Monitoring owner", infrastructure.securityMonitoringOwner),
    ]),
    sectionProgress("Vulnerability Management", [
      field("Vulnerability scan frequency", infrastructure.scanningCadence),
      field(
        "Critical patch timeline status",
        infrastructure.patchingSlaCriticalDaysStatus
      ),
      field(
        "High patch timeline status",
        infrastructure.patchingSlaHighDaysStatus
      ),
    ]),
    sectionProgress("Incident Response", [
      field(
        "Incident response plan exists",
        infrastructure.incidentResponsePlanExists
      ),
      field(
        "Notification timeline",
        infrastructure.incidentNotificationTimeline
      ),
      field(
        "Customer notification process",
        infrastructure.customerNotificationProcess
      ),
      ...(infrastructure.incidentResponsePlanExists
        ? [
            field(
              "Last tested date",
              infrastructure.incidentResponseLastTestedDate
            ),
          ]
        : []),
    ]),
    sectionProgress("Backups", [
      field("Backups enabled", infrastructure.backupsEnabled),
      field("Backup frequency", infrastructure.backupCadence),
      field(
        "Backup retention status",
        infrastructure.backupRetentionDaysStatus
      ),
      field("Restore test frequency", infrastructure.restoreTestingCadence),
    ]),
    sectionProgress("Vendor Risk", [
      field("Vendor review required", infrastructure.vendorReviewRequired),
      field("Vendor review frequency", infrastructure.vendorReviewCadence),
      field(
        "DPA required for processors",
        infrastructure.dpaRequiredForProcessors
      ),
    ]),
  ])
}

export const accessProgress = (profile: ProfileDraft) =>
  groupProgress([
    sectionProgress("Access control", [
      field("Least privilege access", profile.access.leastPrivilege),
      field("Role-based access", profile.access.roleBasedAccess),
      field(
        "Admin access requires approval",
        profile.access.adminApprovalRequired
      ),
      field(
        "Periodic access reviews are performed",
        profile.access.accessReviewsPerformed
      ),
      ...(profile.access.accessReviewsPerformed === true
        ? [field("Access review frequency", profile.access.accessReviewCadence)]
        : []),
    ]),
    sectionProgress("Authentication", [
      field(
        "Multi-factor authentication (MFA) required",
        profile.access.mfaRequired
      ),
      field("Single sign-on supported", profile.access.ssoEnabled),
      field(
        "Password manager required",
        profile.access.passwordManagerRequired
      ),
      field("Shared accounts exist", profile.access.sharedAccountsExist),
      field(
        "Employee offboarding process exists",
        profile.access.offboardingProcessExists
      ),
    ]),
  ])

export const isRealService = (service: ProfileDraft["services"][number]) =>
  Boolean(
    service.id ||
    service.serviceName?.trim() ||
    service.serviceDescription?.trim() ||
    service.serviceUrl?.trim()
  )

const providerUsageProgress = (usage: ServiceProviderUsage) =>
  sectionProgress(usage.providerName || "Selected provider", [
    field("Purpose", usage.purpose),
    field("Data processing level", usage.dataProcessingLevel),
    ...(usage.dataProcessingLevel !== "none"
      ? [
          field("Data processed", usage.dataProcessed),
          field("DPA status", usage.dpaStatus),
          field("Data regions", usage.dataRegions),
        ]
      : []),
  ])

export const serviceProgress = (
  service: ProfileDraft["services"][number],
  serviceProviderUsage: ServiceProviderUsage[]
): ProgressItem => {
  const selectedServiceUses = service.id
    ? serviceProviderUsage.filter((usage) => usage.serviceId === service.id)
    : []

  return {
    id: service.id ?? service.serviceName ?? "service",
    title: service.serviceName?.trim() || "Unnamed service",
    href: service.id ? `/company/services/${service.id}` : "/company/services",
    ...groupProgress([
      sectionProgress("General", [
        field("Service name", service.serviceName),
        field("Service URL", service.serviceUrl),
        field("Description", service.serviceDescription),
      ]),
      sectionProgress("Audience and Availability", [
        field("Business activities", service.businessActivityIds),
        field("User types", service.userTypes),
        field("Customer types", service.customerTypes),
        field("Availability regions", service.availabilityRegions),
        field("Directed to children", service.childrenDirected),
        ...(service.childrenDirected
          ? [field("Minimum user age", service.minimumUserAge, true)]
          : []),
      ]),
      sectionProgress("Cookie Preferences", [
        field(
          "Uses cookies or tracking technologies",
          service.privacy.usesCookiesOrTrackingTechnologies
        ),
        ...(service.privacy.usesCookiesOrTrackingTechnologies
          ? [
              field(
                "Cookie / tracking categories",
                service.privacy.cookieTrackingCategories
              ),
              field(
                "Cookie consent mechanism",
                service.privacy.cookieConsentMechanism
              ),
              field(
                "Do Not Track response",
                service.privacy.doNotTrackResponse
              ),
              field(
                "Global Privacy Control supported",
                service.privacy.globalPrivacyControlSupported
              ),
            ]
          : []),
      ]),
      sectionProgress("Hosting & Data Residency", [
        field("Primary hosting region", service.privacy.primaryHostingRegion),
        field("Data residency options", service.privacy.dataResidencyOptions),
      ]),
      sectionProgress("Providers", [
        field("Selected providers", selectedServiceUses),
        ...selectedServiceUses.map((usage) => {
          const usageProgress = providerUsageProgress(usage)

          return {
            label: usage.providerName || "Provider usage",
            value:
              usageProgress.completedFields === usageProgress.totalFields
                ? "complete"
                : null,
          }
        }),
      ]),
    ]),
  }
}

export const dataTypeProgress = (
  dataType: StoredDataType,
  index: number
): ProgressSection =>
  sectionProgress(dataType.name.trim() || `Data type ${index + 1}`, [
    field("Data type name", dataType.name),
    field("Description", dataType.description),
    field("Subject types", dataType.subjectTypes),
    field("Collection methods", dataType.collectionMethods),
    field("Sensitive data", dataType.isSensitive),
    field("Required for product", dataType.isRequired),
  ])

export const dataProgress = (profile: ProfileDraft) => ({
  general: sectionProgress("General attributes", [
    field("Personal data stored", profile.dataHandling.storesPii),
    field("Health data stored", profile.dataHandling.storesHealthcareData),
    field("Data encrypted at rest", profile.dataHandling.encryptionAtRest),
    field(
      "Data encrypted in transit",
      profile.dataHandling.encryptionInTransit
    ),
    field(
      "Real customer data used in development",
      profile.dataHandling.productionDataInDevelopment
    ),
    field(
      "Retention policy exists",
      profile.dataHandling.retentionPolicyExists
    ),
  ]),
  dataTypes: profile.dataHandling.dataTypesStored.map(dataTypeProgress),
})

export const vendorProgress = (
  provider: OrganizationProvider,
  serviceProviderUsage: ServiceProviderUsage[]
): ProgressItem => {
  const providerUsage = serviceProviderUsage.filter(
    (usage) => usage.organizationProviderId === provider.id
  )

  return {
    id: provider.id,
    title: provider.name,
    href: "/vendors",
    ...groupProgress([
      sectionProgress("Provider record", [
        field("Name", provider.name),
        field("Legal name", provider.legalName),
        field("Category", provider.category),
        field("Country", provider.countryOfRegistration),
        field("Criticality", provider.criticality),
        field("System types", provider.systemTypes),
      ]),
      ...providerUsage.map(providerUsageProgress),
    ]),
  }
}

export const dashboardProgress = ({
  organizationProviders,
  profile,
  serviceProviderUsage,
}: {
  organizationProviders: OrganizationProvider[]
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
}): DashboardProgress => {
  const profileGroup = profileProgress(profile)
  const privacyGroup = privacyProgress(profile)
  const infrastructureGroup = infrastructureProgress(profile)
  const accessGroup = accessProgress(profile)
  const services = profile.services
    .filter(isRealService)
    .map((service) => serviceProgress(service, serviceProviderUsage))
  const data = dataProgress(profile)
  const vendors = organizationProviders.map((provider) =>
    vendorProgress(provider, serviceProviderUsage)
  )
  const topLevelSections = [
    profileGroup,
    privacyGroup,
    infrastructureGroup,
    accessGroup,
    ...services,
    data.general,
    ...data.dataTypes,
    ...vendors,
  ]
  const completedFields = topLevelSections.reduce(
    (total, section) => total + section.completedFields,
    0
  )
  const totalFields = topLevelSections.reduce(
    (total, section) => total + section.totalFields,
    0
  )
  const completedSections = topLevelSections.filter(
    (section) =>
      section.totalFields > 0 && section.completedFields === section.totalFields
  ).length

  return {
    overall: {
      completedFields,
      totalFields,
      percent: percent(completedFields, totalFields),
      completedSections,
      totalSections: topLevelSections.length,
    },
    profile: profileGroup,
    privacy: privacyGroup,
    infrastructure: infrastructureGroup,
    access: accessGroup,
    services,
    data,
    vendors,
  }
}
