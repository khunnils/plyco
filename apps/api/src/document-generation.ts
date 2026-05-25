import { createHash } from "node:crypto"

import nunjucks from "nunjucks"
import {
  type AccessProfile,
  type BusinessActivity,
  type InfrastructureProfile,
  type PrivacyProfile,
  type ServiceProfile,
  type SecurityProgramSnapshot,
  type ServiceProviderUsage,
  type StoredDataType,
  type OrganizationMember,
  type Template,
  type OrganizationProvider,
  type Vocabulary,
} from "@plyco/shared"

type ProviderContextGroup = {
  all: Array<Record<string, unknown>>
  uses: Array<Record<string, unknown>>
  dataProcessors: Array<Record<string, unknown>>
  subprocessors: Array<Record<string, unknown>>
  byService: Array<Record<string, unknown>>
  dataProcessorsAnswered: boolean
  dataProcessorsHasValue: boolean
  subprocessorsAnswered: boolean
  subprocessorsHasValue: boolean
}

export type NormalizedTemplateContext = {
  organization: Record<string, unknown>
  company: Record<string, unknown>
  policy: Record<string, unknown>
  service: Record<string, unknown>
  services: {
    all: Array<Record<string, unknown>>
    primary: Record<string, unknown>
  }
  privacy: Record<string, unknown>
  security: Record<string, unknown>
  infrastructure: Record<string, unknown>
  dataHandling: Record<string, unknown>
  access: Record<string, unknown>
  vendors: ProviderContextGroup
  providers: ProviderContextGroup
}

export class ReportContextBuilder {
  build(
    snapshot: SecurityProgramSnapshot,
    template?: Template,
    members: OrganizationMember[] = [],
    vocabulary?: Vocabulary,
  ): NormalizedTemplateContext {
    const organization = snapshot.organization
    const organizationContext = organization
      ? {
          ...organization.company,
          name: organization.company.companyName,
        }
      : {}
    const legacySnapshot = snapshot as SecurityProgramSnapshot & {
      vendors?: SecurityProgramSnapshot["organizationProviders"]
      serviceVendorUses?: SecurityProgramSnapshot["serviceProviderUsage"]
    }
    const providers = (
      legacySnapshot.organizationProviders ??
      legacySnapshot.vendors ??
      []
    ).map((provider) =>
      this.providerContext(provider),
    )
    const providerUsage = (
      legacySnapshot.serviceProviderUsage ??
      legacySnapshot.serviceVendorUses ??
      []
    ).map((usage) => this.providerUsageContext(usage, providers))
    const services = organization
      ? organization.services.map((service) =>
          this.serviceContext(
            service,
            snapshot.businessActivities,
            providerUsage,
            organization.dataHandling.dataTypesStored,
            vocabulary,
          ),
        )
      : []
    const primaryService = services[0] ?? {}

    return {
      organization: organizationContext,
      company: organizationContext,
      policy: template ? this.policyContext(template, members) : {},
      service: primaryService,
      services: {
        all: services,
        primary: primaryService,
      },
      privacy: organization
        ? this.privacyContext(organization.privacy, vocabulary)
        : {},
      security: organization
        ? this.securityContext(
            organization.access,
            organization.infrastructure,
            vocabulary,
          )
        : {},
      infrastructure: organization
        ? this.withAnswerFlags(organization.infrastructure)
        : {},
      dataHandling: organization
        ? this.withAnswerFlags(organization.dataHandling)
        : {},
      access: organization ? this.withAnswerFlags(organization.access) : {},
      providers: this.providerGroups(services, providers, providerUsage),
      vendors: {
        ...this.providerGroups(services, providers, providerUsage),
      },
    }
  }

  private providerGroups(
    services: Array<Record<string, unknown>>,
    providers: Array<Record<string, unknown>>,
    providerUsage: Array<Record<string, unknown>>,
  ) {
    return {
      all: providers,
      uses: providerUsage,
      dataProcessors: providerUsage.filter((usage) =>
          ["limited", "subprocessor"].includes(
            String(usage.dataProcessingLevel),
          ),
        ),
      subprocessors: providerUsage.filter(
          (usage) => usage.dataProcessingLevel === "subprocessor",
        ),
      byService: this.providersByService(services, providerUsage),
      dataProcessorsAnswered: true,
      dataProcessorsHasValue: providerUsage.some((usage) =>
        ["limited", "subprocessor"].includes(String(usage.dataProcessingLevel)),
      ),
      subprocessorsAnswered: true,
      subprocessorsHasValue: providerUsage.some(
        (usage) => usage.dataProcessingLevel === "subprocessor",
      ),
    }
  }

  private policyContext(template: Template, members: OrganizationMember[]) {
    const owner = members.find(
      (member) => member.userId === template.policyOwnerUserId,
    )
    const approver = members.find(
      (member) => member.userId === template.policyApproverUserId,
    )

    return {
      effectiveDate: template.policyEffectiveDate,
      lastReviewedDate: template.policyLastReviewedDate,
      version: template.policyVersion,
      ownerUserId: template.policyOwnerUserId,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      approverUserId: template.policyApproverUserId,
      approverName: approver?.name ?? "",
      approverEmail: approver?.email ?? "",
      reviewCadence: template.policyReviewCadence,
    }
  }

  private serviceContext(
    service: ServiceProfile,
    activities: BusinessActivity[],
    providerUsage: Array<Record<string, unknown>>,
    dataTypes: StoredDataType[],
    vocabulary?: Vocabulary,
  ) {
    const serviceProviderUsage = providerUsage.filter(
      (usage) => usage.serviceId === service.id,
    )
    const analyticsProviders = serviceProviderUsage.filter(
      (usage) => usage.systemType === "analytics",
    )
    const advertisingProviders = serviceProviderUsage.filter(
      (usage) => usage.systemType === "advertising",
    )
    const serviceActivities = activities
      .filter((activity) => service.businessActivityIds.includes(activity.id))
      .map((activity) => this.businessActivityContext(activity, vocabulary))
    const dataTypeNames = new Set(
      serviceProviderUsage.flatMap((usage) =>
        Array.isArray(usage.dataProcessed)
          ? usage.dataProcessed.map(String)
          : [],
      ),
    )

    return {
      id: service.id,
      name: service.serviceName,
      description: service.serviceDescription,
      url: service.serviceUrl,
      userTypes: service.userTypes,
      userTypeLabels: this.codeLabels(
        vocabulary,
        "service_user_types",
        service.userTypes,
      ),
      customerTypes: service.customerTypes,
      customerTypeLabels: this.codeLabels(
        vocabulary,
        "service_customer_types",
        service.customerTypes,
      ),
      availabilityRegions: service.availabilityRegions,
      availabilityRegionLabels: this.codeLabels(
        vocabulary,
        "regions",
        service.availabilityRegions,
      ),
      childrenDirected: service.childrenDirected,
      minimumUserAge: service.minimumUserAge,
      activities: serviceActivities,
      businessActivities: serviceActivities,
      ...this.answerFlags({
        name: service.serviceName,
        description: service.serviceDescription,
        url: service.serviceUrl,
        userTypes: service.userTypes,
        customerTypes: service.customerTypes,
        availabilityRegions: service.availabilityRegions,
        childrenDirected: service.childrenDirected,
        minimumUserAge: service.minimumUserAge,
      }),
      privacy: {
        usesCookies: service.privacy.usesCookies,
        cookieTypes: service.privacy.cookieTypes,
        cookieTypeLabels: this.codeLabels(
          vocabulary,
          "privacy_cookie_types",
          service.privacy.cookieTypes,
        ),
        analyticsProviders: this.providerNames(
          analyticsProviders,
        ),
        analyticsProviderIds: this.providerIds(
          analyticsProviders,
        ),
        advertisingProviders: this.providerNames(
          advertisingProviders,
        ),
        advertisingProviderIds: this.providerIds(
          advertisingProviders,
        ),
        primaryHostingRegion: service.privacy.primaryHostingRegion,
        primaryHostingRegionLabel: service.privacy.primaryHostingRegion
          ? this.codeLabels(
              vocabulary,
              "regions",
              [service.privacy.primaryHostingRegion],
            )[0]
          : "",
        dataResidencyOptions: service.privacy.dataResidencyOptions,
        dataResidencyOptionLabels: this.codeLabels(
          vocabulary,
          "regions",
          service.privacy.dataResidencyOptions,
        ),
        ...this.answerFlags(service.privacy),
      },
      providerUsage: serviceProviderUsage,
      vendorUses: serviceProviderUsage,
      providers: serviceProviderUsage,
      vendors: serviceProviderUsage,
      subprocessors: serviceProviderUsage.filter(
        (usage) => usage.dataProcessingLevel === "subprocessor",
      ),
      dataTypes: dataTypes.filter((dataType) =>
        dataTypeNames.has(String(dataType.name)),
      ),
    }
  }

  private privacyContext(privacy: PrivacyProfile, vocabulary?: Vocabulary) {
    return {
      supportedRights: privacy.supportedRights,
      supportedRightLabels: this.codeLabels(
        vocabulary,
        "privacy_supported_rights",
        privacy.supportedRights,
      ),
      requestMethods: privacy.requestMethods,
      requestMethodLabels: this.codeLabels(
        vocabulary,
        "privacy_request_methods",
        privacy.requestMethods,
      ),
      responseTimelineDays: privacy.responseTimelineDays,
      identityVerificationRequired: privacy.identityVerificationRequired,
      authorizedAgentSupported: privacy.authorizedAgentSupported,
      appealProcessExists: privacy.appealProcessExists,
      cookieConsentMechanism: privacy.cookieConsentMechanism,
      cookieConsentMechanismLabel: privacy.cookieConsentMechanism
        ? this.codeLabels(
            vocabulary,
            "privacy_cookie_consent_mechanisms",
            [privacy.cookieConsentMechanism],
          )[0]
        : "",
      doNotTrackResponse: privacy.doNotTrackResponse,
      globalPrivacyControlSupported: privacy.globalPrivacyControlSupported,
      sendsMarketingEmails: privacy.sendsMarketingEmails,
      marketingOptOutMethod: privacy.marketingOptOutMethod,
      marketingOptOutMethodLabel: privacy.marketingOptOutMethod
        ? this.codeLabels(
            vocabulary,
            "privacy_marketing_opt_out_methods",
            [privacy.marketingOptOutMethod],
          )[0]
        : "",
      transactionalEmailsSent: privacy.transactionalEmailsSent,
      newsletterProvider:
        this.providerNames(privacy.organizationProviders)[0] ?? "",
      newsletterProviderId:
        this.providerIds(privacy.organizationProviders)[0] ?? "",
      crossBorderTransfers: privacy.crossBorderTransfers,
      transferMechanisms: privacy.transferMechanisms,
      transferMechanismLabels: this.codeLabels(
        vocabulary,
        "privacy_transfer_mechanisms",
        privacy.transferMechanisms,
      ),
      sellsOrSharesData: privacy.sellsOrSharesData,
      doNotSellLink: privacy.doNotSellLink,
      dpoStatus: privacy.dpoStatus,
      dpoStatusLabel: this.codeLabel(
        vocabulary,
        "privacy_dpo_statuses",
        privacy.dpoStatus,
      ),
      dpoName: privacy.dpoName,
      dpoEmail: privacy.dpoEmail,
      euRepresentativeStatus: privacy.euRepresentativeStatus,
      euRepresentativeStatusLabel: this.codeLabel(
        vocabulary,
        "privacy_eu_representative_statuses",
        privacy.euRepresentativeStatus,
      ),
      euRepresentativeName: privacy.euRepresentativeName,
      euRepresentativeAddress: privacy.euRepresentativeAddress,
      usesAutomatedDecisionMaking: privacy.usesAutomatedDecisionMaking,
      ...this.answerFlags(privacy),
    }
  }

  private providerIds(providers: Array<Record<string, unknown>>) {
    return providers.map((provider) =>
      String(provider.providerId ?? provider.organizationProviderId ?? ""),
    )
  }

  private providerNames(providers: Array<Record<string, unknown>>) {
    return providers.map((provider) => {
      const id = String(provider.providerId ?? provider.organizationProviderId ?? "")
      if (id === "none") {
        return "None"
      }
      return String(provider.name ?? provider.providerName ?? id ?? "")
    })
  }

  private securityContext(
    access: AccessProfile,
    infrastructure: InfrastructureProfile,
    vocabulary?: Vocabulary,
  ) {
    return {
      accessControl: {
        leastPrivilege: access.leastPrivilege,
        roleBasedAccess: access.roleBasedAccess,
        accessReviewCadence: access.accessReviewCadence,
        accessReviewCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          access.accessReviewCadence,
        ),
        adminApprovalRequired: access.adminApprovalRequired,
        ...this.answerFlags({
          leastPrivilege: access.leastPrivilege,
          roleBasedAccess: access.roleBasedAccess,
          accessReviewCadence: access.accessReviewCadence,
          adminApprovalRequired: access.adminApprovalRequired,
        }),
      },
      authentication: {
        mfaRequired: access.mfaRequired,
        ssoSupported: access.ssoEnabled,
        passwordManagerRequired: access.passwordManagerRequired,
        ...this.answerFlags({
          mfaRequired: access.mfaRequired,
          ssoSupported: access.ssoEnabled,
          passwordManagerRequired: access.passwordManagerRequired,
        }),
      },
      encryption: {
        atRestAlgorithm: infrastructure.atRestAlgorithm,
        atRestAlgorithmLabel: this.codeLabel(
          vocabulary,
          "security_encryption_algorithms",
          infrastructure.atRestAlgorithm,
        ),
        inTransitMinimumTlsVersion:
          infrastructure.inTransitMinimumTlsVersion,
        inTransitMinimumTlsVersionLabel: this.codeLabel(
          vocabulary,
          "security_tls_versions",
          infrastructure.inTransitMinimumTlsVersion,
        ),
        keyManagementProvider: infrastructure.keyManagementProvider,
        keyManagementProviderLabel: this.codeLabel(
          vocabulary,
          "security_key_management_providers",
          infrastructure.keyManagementProvider,
        ),
        ...this.answerFlags({
          atRestAlgorithm: infrastructure.atRestAlgorithm,
          inTransitMinimumTlsVersion:
            infrastructure.inTransitMinimumTlsVersion,
          keyManagementProvider: infrastructure.keyManagementProvider,
        }),
      },
      logging: {
        centralizedLogging: infrastructure.centralizedLoggingEnabled,
        logRetentionDays: infrastructure.logRetentionDays,
        securityMonitoringOwner: infrastructure.securityMonitoringOwner,
        securityMonitoringOwnerLabel: this.codeLabel(
          vocabulary,
          "security_monitoring_owners",
          infrastructure.securityMonitoringOwner,
        ),
        ...this.answerFlags({
          centralizedLogging: infrastructure.centralizedLoggingEnabled,
          logRetentionDays: infrastructure.logRetentionDays,
          securityMonitoringOwner: infrastructure.securityMonitoringOwner,
        }),
      },
      vulnerabilityManagement: {
        scanningCadence: infrastructure.scanningCadence,
        scanningCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          infrastructure.scanningCadence,
        ),
        patchingSlaCriticalDays: infrastructure.patchingSlaCriticalDays,
        patchingSlaHighDays: infrastructure.patchingSlaHighDays,
        ...this.answerFlags({
          scanningCadence: infrastructure.scanningCadence,
          patchingSlaCriticalDays: infrastructure.patchingSlaCriticalDays,
          patchingSlaHighDays: infrastructure.patchingSlaHighDays,
        }),
      },
      incidentResponse: {
        planExists: infrastructure.incidentResponsePlanExists,
        notificationTimeline: infrastructure.incidentNotificationTimeline,
        notificationTimelineLabel: this.codeLabel(
          vocabulary,
          "security_notification_timelines",
          infrastructure.incidentNotificationTimeline,
        ),
        customerNotificationProcess:
          infrastructure.customerNotificationProcess,
        customerNotificationProcessLabel: this.codeLabel(
          vocabulary,
          "security_customer_notification_processes",
          infrastructure.customerNotificationProcess,
        ),
        lastTestedDate: infrastructure.incidentResponseLastTestedDate,
        ...this.answerFlags({
          planExists: infrastructure.incidentResponsePlanExists,
          notificationTimeline: infrastructure.incidentNotificationTimeline,
          customerNotificationProcess:
            infrastructure.customerNotificationProcess,
          lastTestedDate: infrastructure.incidentResponseLastTestedDate,
        }),
      },
      backups: {
        backupCadence: infrastructure.backupCadence,
        backupCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          infrastructure.backupCadence,
        ),
        backupRetentionDays: infrastructure.backupRetentionDays,
        restoreTestingCadence: infrastructure.restoreTestingCadence,
        restoreTestingCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          infrastructure.restoreTestingCadence,
        ),
        ...this.answerFlags({
          backupCadence: infrastructure.backupCadence,
          backupRetentionDays: infrastructure.backupRetentionDays,
          restoreTestingCadence: infrastructure.restoreTestingCadence,
        }),
      },
      vendorRisk: {
        vendorReviewRequired: infrastructure.vendorReviewRequired,
        vendorReviewCadence: infrastructure.vendorReviewCadence,
        vendorReviewCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          infrastructure.vendorReviewCadence,
        ),
        dpaRequiredForProcessors: infrastructure.dpaRequiredForProcessors,
        ...this.answerFlags({
          vendorReviewRequired: infrastructure.vendorReviewRequired,
          vendorReviewCadence: infrastructure.vendorReviewCadence,
          dpaRequiredForProcessors: infrastructure.dpaRequiredForProcessors,
        }),
      },
    }
  }

  private codeLabels(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    values: string[] | null,
  ) {
    const codeSet = vocabulary?.codeSets.find(
      (currentCodeSet) => currentCodeSet.codeSetId === codeSetId,
    )

    return (values ?? []).map(
      (value) =>
        codeSet?.codes.find((code) => code.codeId === value)?.name ?? value,
    )
  }

  private codeLabel(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    value: string | null,
  ) {
    return value ? this.codeLabels(vocabulary, codeSetId, [value])[0] : ""
  }

  private withAnswerFlags<T extends Record<string, unknown>>(value: T) {
    return {
      ...value,
      ...this.answerFlags(value),
    }
  }

  private answerFlags(values: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => key !== "organizationProviders")
        .flatMap(([key, value]) => [
          [`${key}Answered`, this.answered(value)],
          [`${key}HasValue`, this.hasValue(value)],
        ]),
    )
  }

  private answered(value: unknown) {
    return value !== null && value !== undefined
  }

  private hasValue(value: unknown) {
    if (!this.answered(value)) {
      return false
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "number") {
      return value > 0
    }

    if (typeof value === "string") {
      return value.trim().length > 0
    }

    return true
  }

  private providerContext(provider: OrganizationProvider) {
    return {
      id: provider.id,
      providerId: provider.providerId,
      systemTypes: provider.systemTypes,
      name: provider.name,
      legalName: provider.legalName,
      category: provider.category,
      countryOfRegistration: provider.countryOfRegistration,
      criticality: provider.criticality,
      notes: provider.notes,
    }
  }

  private providerUsageContext(
    providerUsage: ServiceProviderUsage,
    providers: Array<Record<string, unknown>>,
  ) {
    const legacyUsage = providerUsage as ServiceProviderUsage & {
      vendorName?: string
    }
    const provider =
      providers.find(
        (currentProvider) =>
          currentProvider.id === providerUsage.organizationProviderId,
      ) ??
      {}

    return {
      ...provider,
      id: providerUsage.id,
      serviceId: providerUsage.serviceId,
      serviceName: providerUsage.serviceName,
      organizationProviderId: providerUsage.organizationProviderId,
      vendorId: providerUsage.organizationProviderId,
      providerName: providerUsage.providerName || legacyUsage.vendorName || "",
      vendorName: providerUsage.providerName || legacyUsage.vendorName || "",
      systemType: providerUsage.systemType,
      name: providerUsage.providerName || legacyUsage.vendorName || "",
      purpose: providerUsage.purpose,
      dataProcessingLevel: providerUsage.dataProcessingLevel,
      dataProcessed: providerUsage.dataProcessed,
      dpaStatus: providerUsage.dpaStatus,
      dataRegions: providerUsage.dataRegions,
      notes: providerUsage.notes || provider.notes,
    }
  }

  private businessActivityContext(
    activity: BusinessActivity,
    vocabulary?: Vocabulary,
  ) {
    return {
      id: activity.id,
      name: activity.name,
      purpose: activity.purpose,
      role: activity.role,
      roleLabel: activity.role
        ? this.codeLabels(vocabulary, "activity_role", [activity.role])[0] ??
          activity.role
        : "",
      legalBasis: activity.legalBasis,
      legalBasisLabels: this.codeLabels(
        vocabulary,
        "legal_basis",
        activity.legalBasis,
      ),
      retentionDays: activity.retentionDays,
      retentionLabel:
        activity.retentionDays > 0
          ? `${activity.retentionDays} days`
          : "Not set",
    }
  }

  private providersByService(
    services: Array<Record<string, unknown>>,
    providers: Array<Record<string, unknown>>,
  ) {
    return services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      providers: providers.filter((provider) => provider.serviceId === service.id),
      vendors: providers.filter((provider) => provider.serviceId === service.id),
    }))
  }
}

export class Jinja2Renderer {
  render(template: Template, context: NormalizedTemplateContext): string {
    return nunjucks.renderString(template.content, context)
  }
}

export function templateSourceHash(
  template: Pick<Template, "content">,
  context: NormalizedTemplateContext,
) {
  return createHash("sha256")
    .update(stableStringify({ content: template.content, context }))
    .digest("hex")
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}
