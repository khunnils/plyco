import { createHash } from "node:crypto"

import nunjucks from "nunjucks"
import {
  type AccessProfile,
  type InfrastructureProfile,
  type PrivacyProfile,
  type ServiceProfile,
  type SecurityProgramSnapshot,
  type StoredDataType,
  type OrganizationMember,
  type Template,
  type Vendor,
  type Vocabulary,
} from "@plyco/shared"

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
  vendors: {
    all: Array<Record<string, unknown>>
    dataProcessors: Array<Record<string, unknown>>
    subprocessors: Array<Record<string, unknown>>
    byService: Array<Record<string, unknown>>
  }
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
    const vendors = snapshot.vendors.map((vendor) => this.vendorContext(vendor))
    const services = organization
      ? organization.services.map((service) =>
          this.serviceContext(
            service,
            vendors,
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
      infrastructure: organization?.infrastructure ?? {},
      dataHandling: organization?.dataHandling ?? {},
      access: organization?.access ?? {},
      vendors: {
        all: vendors,
        dataProcessors: vendors.filter((vendor) =>
          ["limited", "subprocessor"].includes(
            String(vendor.dataProcessingLevel),
          ),
        ),
        subprocessors: vendors.filter(
          (vendor) => vendor.dataProcessingLevel === "subprocessor",
        ),
        byService: this.vendorsByService(services, vendors),
      },
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
    vendors: Array<Record<string, unknown>>,
    dataTypes: StoredDataType[],
    vocabulary?: Vocabulary,
  ) {
    const serviceVendors = vendors.filter(
      (vendor) => vendor.serviceId === service.id,
    )
    const dataTypeNames = new Set(
      serviceVendors.flatMap((vendor) =>
        Array.isArray(vendor.dataProcessed)
          ? vendor.dataProcessed.map(String)
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
      privacy: {
        usesCookies: service.privacy.usesCookies,
        cookieTypes: service.privacy.cookieTypes,
        cookieTypeLabels: this.codeLabels(
          vocabulary,
          "privacy_cookie_types",
          service.privacy.cookieTypes,
        ),
        analyticsProviders: this.providerNames(
          service.privacy.analyticsProviders,
        ),
        analyticsProviderIds: this.providerIds(
          service.privacy.analyticsProviders,
        ),
        advertisingProviders: this.providerNames(
          service.privacy.advertisingProviders,
        ),
        advertisingProviderIds: this.providerIds(
          service.privacy.advertisingProviders,
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
      },
      vendors: serviceVendors,
      subprocessors: serviceVendors.filter(
        (vendor) => vendor.dataProcessingLevel === "subprocessor",
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
      dpoName: privacy.dpoName,
      dpoEmail: privacy.dpoEmail,
      euRepresentativeName: privacy.euRepresentativeName,
      euRepresentativeAddress: privacy.euRepresentativeAddress,
      usesAutomatedDecisionMaking: privacy.usesAutomatedDecisionMaking,
    }
  }

  private providerIds(providers: PrivacyProfile["organizationProviders"]) {
    return providers.map((provider) => provider.providerId)
  }

  private providerNames(providers: PrivacyProfile["organizationProviders"]) {
    return providers.map((provider) => provider.name ?? provider.providerId)
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
      },
      authentication: {
        mfaRequired: access.mfaRequired,
        ssoSupported: access.ssoEnabled,
        passwordManagerRequired: access.passwordManagerRequired,
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
      },
    }
  }

  private codeLabels(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    values: string[],
  ) {
    const codeSet = vocabulary?.codeSets.find(
      (currentCodeSet) => currentCodeSet.codeSetId === codeSetId,
    )

    return values.map(
      (value) =>
        codeSet?.codes.find((code) => code.codeId === value)?.name ?? value,
    )
  }

  private codeLabel(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    value: string,
  ) {
    return value ? this.codeLabels(vocabulary, codeSetId, [value])[0] : ""
  }

  private vendorContext(vendor: Vendor) {
    return {
      serviceId: vendor.serviceId,
      serviceName: vendor.serviceName,
      name: vendor.name,
      legalName: vendor.legalName,
      displayName: vendor.displayName,
      providerOrganizationName: vendor.providerOrganizationName,
      providerOrganizationLegalName: vendor.providerOrganizationLegalName,
      privacyPolicyUrl: vendor.privacyPolicyUrl,
      dpaUrl: vendor.dpaUrl,
      securityPageUrl: vendor.securityPageUrl,
      category: vendor.category,
      purpose: vendor.purpose,
      countryOfRegistration: vendor.countryOfRegistration,
      hasSubprocessors: vendor.hasSubprocessors,
      dataProcessingLevel: vendor.dataProcessingLevel,
      dataProcessed: vendor.dataProcessed,
      dpaStatus: vendor.dpaStatus,
      dataRegions: vendor.dataRegions,
      criticality: vendor.criticality,
      owner: vendor.owner,
      notes: vendor.notes,
    }
  }

  private vendorsByService(
    services: Array<Record<string, unknown>>,
    vendors: Array<Record<string, unknown>>,
  ) {
    return services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      vendors: vendors.filter((vendor) => vendor.serviceId === service.id),
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
