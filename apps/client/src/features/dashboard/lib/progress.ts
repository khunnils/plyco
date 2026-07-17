import {
  isComplianceFieldVisible,
  type OrganizationProvider,
  type ServiceProviderUsage,
  type StoredDataType,
  type BusinessActivity,
} from "@plyco/shared"

import { type ProfileDraft } from "@/features/company/types/company"
import { hasCookieCategoriesRequiringConsent } from "@/features/company/services/lib/cookie-requirements"

export type ProgressMetric = {
  completedFields: number
  totalFields: number
  percent: number
}

export const isProgressComplete = (metric: ProgressMetric) =>
  metric.totalFields > 0 && metric.completedFields === metric.totalFields

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
  security: ProgressGroup
  access: ProgressGroup
  services: ProgressItem[]
  data: {
    dataTypes: ProgressSection[]
  }
  vendors: ProgressItem[]
  activities: ProgressSection[]
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
    const trimmed = value.trim()
    return trimmed.length > 0 && trimmed !== "not_set"
  }

  if (typeof value === "number") {
    return options.zeroMeansUnset ? value !== 0 : true
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

export const isActivityComplete = (
  activity: BusinessActivity,
  showLegalBasis: boolean
) => {
  const isNameSet = isAnswered(activity.name)
  const isPurposeSet = isAnswered(activity.purpose)
  const isRoleSet = isAnswered(activity.role)
  const isRetentionSet = isAnswered(activity.retentionPolicy)
  const isUsesAiSet = isAnswered(activity.usesAi)
  const isLegalBasisSet =
    !showLegalBasis ||
    (Array.isArray(activity.legalBasis) && activity.legalBasis.length > 0)
  const isAiDetailSet =
    activity.usesAi !== true ||
    (isAnswered(activity.aiUseCases) &&
      isAnswered(activity.aiCustomerDataUsedForTraining) &&
      isAnswered(activity.aiCustomerDataSentToProviders) &&
      isAnswered(activity.aiHumanReviewOfOutputs) &&
      isAnswered(activity.aiUsersInformedWhenUsed))

  return (
    isNameSet &&
    isPurposeSet &&
    isRoleSet &&
    isRetentionSet &&
    isUsesAiSet &&
    isLegalBasisSet &&
    isAiDetailSet
  )
}

export const activityProgress = (
  activity: BusinessActivity,
  showLegalBasis: boolean,
  index: number
): ProgressSection => {
  const fields = [
    field("Activity name", activity.name),
    field("Purpose", activity.purpose),
    field("Role", activity.role),
    field("Retention policy", activity.retentionPolicy),
    field("Uses AI", activity.usesAi),
    ...(activity.usesAi === true
      ? [
          field("AI use cases", activity.aiUseCases),
          field(
            "Customer data used for training",
            activity.aiCustomerDataUsedForTraining
          ),
          field(
            "Customer data sent to AI providers",
            activity.aiCustomerDataSentToProviders
          ),
          field("Human review of AI outputs", activity.aiHumanReviewOfOutputs),
          field(
            "Users informed when AI is used",
            activity.aiUsersInformedWhenUsed
          ),
        ]
      : []),
    ...(showLegalBasis ? [field("Legal basis", activity.legalBasis)] : []),
  ]

  return sectionProgress(
    activity.name?.trim() || `Activity ${index + 1}`,
    fields
  )
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
      field("Stores personal data", profile.company.storesPii),
      field("Stores health data", profile.company.storesHealthcareData),
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
      field(
        "Production data used in development",
        privacy.productionDataInDevelopment
      ),
      field("Retention policy exists", privacy.retentionPolicyExists),
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
        "AI providers",
        providersForType(infrastructure.organizationProviders, "ai")
      ),
      field(
        "Cloud providers",
        providersForType(infrastructure.organizationProviders, "cloud")
      ),
      field(
        "Code repository",
        providersForType(infrastructure.organizationProviders, "source_control")
      ),
      field(
        "Issue tracking",
        providersForType(infrastructure.organizationProviders, "issue_tracking")
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
    ]),
    sectionProgress("Encryption", [
      field("Encrypted at rest", infrastructure.encryptionAtRest),
      ...(infrastructure.encryptionAtRest === true
        ? [field("Stored data encryption", infrastructure.atRestAlgorithm)]
        : []),
      field("Encrypted in transit", infrastructure.encryptionInTransit),
      ...(infrastructure.encryptionInTransit === true
        ? [
            field(
              "Minimum TLS version",
              infrastructure.inTransitMinimumTlsVersion
            ),
          ]
        : []),
      field("Key management", infrastructure.keyManagementProvider),
      field("Work devices encrypted", infrastructure.encryptedDevicesRequired),
    ]),
    sectionProgress("Monitoring & Detection", [
      field(
        "Centralized logging enabled",
        infrastructure.centralizedLoggingEnabled
      ),
      field("Security monitoring", infrastructure.securityMonitoring),
    ]),
    sectionProgress("Backups", [
      field("Backups enabled", infrastructure.backupsEnabled),
      ...(infrastructure.backupsEnabled === true
        ? [
            field("Backup frequency", infrastructure.backupCadence),
            field(
              "Backup retention status",
              infrastructure.backupRetentionDaysStatus
            ),
            field(
              "Restore test frequency",
              infrastructure.restoreTestingCadence
            ),
          ]
        : []),
    ]),
    sectionProgress("Vendor Risk", [
      field("Vendor review required", infrastructure.vendorReviewRequired),
      ...(infrastructure.vendorReviewRequired === true
        ? [field("Vendor review frequency", infrastructure.vendorReviewCadence)]
        : []),
      ...(isComplianceFieldVisible(
        "infrastructure.dpaRequiredForProcessors",
        profile.company.complianceGoals
      )
        ? [
            field(
              "DPA required for processors",
              infrastructure.dpaRequiredForProcessors
            ),
          ]
        : []),
    ]),
  ])
}

export const securityProgress = (profile: ProfileDraft) => {
  const security = profile.security
  return groupProgress([
    sectionProgress("Development Security", [
      field("Code review required", security.codeReviewRequired),
      field(
        "Dependency security monitoring",
        security.dependencySecurityMonitoring
      ),
      field("Secret scanning", security.secretScanning),
      field(
        "Automated testing before deployment",
        security.automatedTestingBeforeDeployment
      ),
      field("CI/CD deployment process", security.cicdDeploymentProcess),
      field(
        "Production deployment approval required",
        security.productionDeploymentApprovalRequired
      ),
    ]),
    sectionProgress("Vulnerability Detection", [
      field("Vulnerability scan frequency", security.scanningCadence),
      field(
        "Penetration testing strategy",
        security.penetrationTestingStrategy
      ),
      ...(security.penetrationTestingStrategy &&
      security.penetrationTestingStrategy !== "none"
        ? [
            field(
              "Penetration testing frequency",
              security.penetrationTestingCadence
            ),
          ]
        : []),
    ]),
    sectionProgress("Vulnerability Remediation", [
      field(
        "Critical patch timeline status",
        security.patchingSlaCriticalDaysStatus
      ),
      field("High patch timeline status", security.patchingSlaHighDaysStatus),
      field(
        "Responsible disclosure program exists",
        security.vulnerabilityDisclosureProgramExists
      ),
      ...(security.vulnerabilityDisclosureProgramExists === true
        ? [
            field(
              "Responsible disclosure URL",
              security.vulnerabilityDisclosureUrl
            ),
          ]
        : []),
    ]),
    sectionProgress("Incident Response", [
      field(
        "Incident response plan exists",
        security.incidentResponsePlanExists
      ),
      field("Notification timeline", security.incidentNotificationTimeline),
      field(
        "Customer notification process",
        security.customerNotificationProcess
      ),
      ...(security.incidentResponsePlanExists === true
        ? [field("Last tested date", security.incidentResponseLastTestedDate)]
        : []),
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
    sectionProgress("Personnel security", [
      field(
        "Security awareness training required",
        profile.access.securityTrainingRequired
      ),
      field(
        "Confidentiality / NDA agreements required",
        profile.access.confidentialityAgreementsRequired
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

export const providerUsageProgress = (usage: ServiceProviderUsage) =>
  sectionProgress(usage.providerName || "Selected provider", [
    field("Purpose", usage.purpose),
    field("Data processing level", usage.dataProcessingLevel),
    ...(usage.dataProcessingLevel !== "none" &&
    usage.dataProcessingLevel !== "not_set"
      ? [
          field("Data processed", usage.dataProcessed),
          field("DPA status", usage.dpaStatus),
          field("Data regions", usage.dataRegions),
        ]
      : []),
  ])

export const serviceDetailsProgress = (
  service: ProfileDraft["services"][number]
) => {
  const requiresCookieConsent = hasCookieCategoriesRequiringConsent(
    service.privacy.cookieCategories
  )
  const cookieCategories = service.privacy.cookieCategories ?? []
  const fields = [
    field("Service name", service.serviceName),
    field("Service URL", service.serviceUrl),
    field("Description", service.serviceDescription),
    field("User types", service.userTypes),
    field("Customer types", service.customerTypes),
    field("Availability regions", service.availabilityRegions),
    field("Directed to children", service.childrenDirected),
    ...(service.childrenDirected
      ? [field("Minimum user age", service.minimumUserAge, true)]
      : []),
    field(
      "Uses cookies or tracking technologies",
      service.privacy.usesCookiesOrTrackingTechnologies
    ),
    ...(service.privacy.usesCookiesOrTrackingTechnologies
      ? [
          field("Cookie categories", service.privacy.cookieCategories),
          ...cookieCategories.map((category) =>
            field(
              `${category.category} requires consent`,
              category.requiresConsent
            )
          ),
          ...(requiresCookieConsent
            ? [
                field(
                  "Cookie consent mechanism",
                  service.privacy.cookieConsentMechanism
                ),
                field(
                  "Blocks non-essential cookies until consent",
                  service.privacy.nonEssentialCookiesBlockedUntilConsent
                ),
                field(
                  "Consent withdrawal method",
                  service.privacy.cookieConsentWithdrawalMethod
                ),
                field(
                  "Global Privacy Control supported",
                  service.privacy.globalPrivacyControlSupported
                ),
              ]
            : []),
        ]
      : []),
    field("Primary hosting region", service.privacy.primaryHostingRegion),
  ]

  const completedFields = fields.filter((f) =>
    isAnswered(f.value, { zeroMeansUnset: f.zeroMeansUnset })
  ).length
  const totalFields = fields.length

  return {
    completedFields,
    totalFields,
    percent: percent(completedFields, totalFields),
    isComplete: totalFields > 0 && completedFields === totalFields,
  }
}

export const serviceProgress = (
  service: ProfileDraft["services"][number],
  serviceProviderUsage: ServiceProviderUsage[]
): ProgressItem => {
  const selectedServiceUses = service.id
    ? serviceProviderUsage.filter((usage) => usage.serviceId === service.id)
    : []
  const requiresCookieConsent = hasCookieCategoriesRequiringConsent(
    service.privacy.cookieCategories
  )
  const cookieCategories = service.privacy.cookieCategories ?? []

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
      sectionProgress("Cookies", [
        field(
          "Uses cookies or tracking technologies",
          service.privacy.usesCookiesOrTrackingTechnologies
        ),
        ...(service.privacy.usesCookiesOrTrackingTechnologies
          ? [
              field("Cookie categories", service.privacy.cookieCategories),
              ...cookieCategories.map((category) =>
                field(
                  `${category.category} requires consent`,
                  category.requiresConsent
                )
              ),
              ...(requiresCookieConsent
                ? [
                    field(
                      "Cookie consent mechanism",
                      service.privacy.cookieConsentMechanism
                    ),
                    field(
                      "Blocks non-essential cookies until consent",
                      service.privacy.nonEssentialCookiesBlockedUntilConsent
                    ),
                    field(
                      "Consent withdrawal method",
                      service.privacy.cookieConsentWithdrawalMethod
                    ),
                    field(
                      "Global Privacy Control supported",
                      service.privacy.globalPrivacyControlSupported
                    ),
                  ]
                : []),
            ]
          : []),
      ]),
      sectionProgress("Service Hosting", [
        field("Primary hosting region", service.privacy.primaryHostingRegion),
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
  businessActivities = [],
}: {
  organizationProviders: OrganizationProvider[]
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
  businessActivities?: BusinessActivity[]
}): DashboardProgress => {
  const profileGroup = profileProgress(profile)
  const privacyGroup = privacyProgress(profile)
  const infrastructureGroup = infrastructureProgress(profile)
  const securityGroup = securityProgress(profile)
  const accessGroup = accessProgress(profile)
  const services = profile.services
    .filter(isRealService)
    .map((service) => serviceProgress(service, serviceProviderUsage))
  const data = dataProgress(profile)
  const vendors = organizationProviders.map((provider) =>
    vendorProgress(provider, serviceProviderUsage)
  )

  const showLegalBasis = isComplianceFieldVisible(
    "businessActivity.legalBasis",
    profile.company.complianceGoals
  )
  const activities = businessActivities.map((activity, index) =>
    activityProgress(activity, showLegalBasis, index)
  )

  const servicesTotalFields = services.reduce(
    (sum, s) => sum + s.totalFields,
    0
  )
  const servicesCompletedFields = services.reduce(
    (sum, s) => sum + s.completedFields,
    0
  )
  const servicesSection: ProgressMetric = {
    completedFields: servicesCompletedFields,
    totalFields: servicesTotalFields,
    percent: percent(servicesCompletedFields, servicesTotalFields),
  }

  const dataTypesTotalFields = data.dataTypes.reduce(
    (sum, d) => sum + d.totalFields,
    0
  )
  const dataTypesCompletedFields = data.dataTypes.reduce(
    (sum, d) => sum + d.completedFields,
    0
  )
  const dataTypesSection: ProgressMetric = {
    completedFields: dataTypesCompletedFields,
    totalFields: dataTypesTotalFields,
    percent: percent(dataTypesCompletedFields, dataTypesTotalFields),
  }

  const activitiesTotalFields = activities.reduce(
    (sum, a) => sum + a.totalFields,
    0
  )
  const activitiesCompletedFields = activities.reduce(
    (sum, a) => sum + a.completedFields,
    0
  )
  const activitiesSection: ProgressMetric = {
    completedFields: activitiesCompletedFields,
    totalFields: activitiesTotalFields,
    percent: percent(activitiesCompletedFields, activitiesTotalFields),
  }

  const topLevelSections = [
    profileGroup,
    privacyGroup,
    infrastructureGroup,
    securityGroup,
    accessGroup,
    servicesSection,
    dataTypesSection,
    activitiesSection,
  ]

  const completedFields = topLevelSections.reduce(
    (total, section) => total + section.completedFields,
    0
  )
  const totalFields = topLevelSections.reduce(
    (total, section) => total + section.totalFields,
    0
  )

  const activeSections = topLevelSections.filter(
    (section) => section.totalFields > 0
  )
  const completedSections = activeSections.filter(
    (section) => section.completedFields === section.totalFields
  ).length
  const totalSections = activeSections.length

  return {
    overall: {
      completedFields,
      totalFields,
      percent: percent(completedFields, totalFields),
      completedSections,
      totalSections,
    },
    profile: profileGroup,
    privacy: privacyGroup,
    infrastructure: infrastructureGroup,
    security: securityGroup,
    access: accessGroup,
    services,
    data,
    vendors,
    activities,
  }
}
