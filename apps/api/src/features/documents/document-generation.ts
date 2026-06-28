import { createHash } from "node:crypto";

import nunjucks from "nunjucks";
import {
  type AccessProfile,
  type BusinessActivity,
  type DataHandlingProfile,
  type Document,
  type DocumentSourceFingerprint,
  type InfrastructureProfile,
  type SecurityProfile,
  type OrganizationSecurityProfile,
  type PrivacyProfile,
  type ServiceProfile,
  type SecurityProgramSnapshot,
  type ServiceProviderUsage,
  type StoredDataType,
  type OrganizationMember,
  type Template,
  type OrganizationProvider,
  type Vocabulary,
} from "@plyco/shared";

type ProviderContextGroup = {
  all: Array<Record<string, unknown>>;
  uses: Array<Record<string, unknown>>;
  dataProcessors: Array<Record<string, unknown>>;
  subprocessors: Array<Record<string, unknown>>;
  byService: Array<Record<string, unknown>>;
  dataProcessorsAnswered: boolean;
  dataProcessorsHasValue: boolean;
  subprocessorsAnswered: boolean;
  subprocessorsHasValue: boolean;
};

export type NormalizedTemplateContext = {
  organization: Record<string, unknown>;
  company: Record<string, unknown>;
  policy: Record<string, unknown>;
  service: Record<string, unknown>;
  services: {
    all: Array<Record<string, unknown>>;
    primary: Record<string, unknown>;
    hasActivities: boolean;
    usesAi: boolean;
    cookiesAnswered: boolean;
    hasHostingRegion: boolean;
    hasAllSubprocessorsDataRegion: boolean;
  };
  privacy: Record<string, unknown>;
  security: Record<string, unknown>;
  infrastructure: Record<string, unknown>;
  dataHandling: Record<string, unknown>;
  access: Record<string, unknown>;
  vendors: ProviderContextGroup;
  providers: ProviderContextGroup;
};

export class ReportContextBuilder {
  build(
    snapshot: SecurityProgramSnapshot,
    template?: Template,
    members: OrganizationMember[] = [],
    vocabulary?: Vocabulary,
  ): NormalizedTemplateContext {
    const organization = snapshot.organization;
    const organizationContext = organization
      ? {
          ...organization.company,
          name: organization.company.companyName,
        }
      : {};
    const legacySnapshot = snapshot as SecurityProgramSnapshot & {
      vendors?: SecurityProgramSnapshot["organizationProviders"];
      serviceVendorUses?: SecurityProgramSnapshot["serviceProviderUsage"];
    };
    const providers = (
      legacySnapshot.organizationProviders ??
      legacySnapshot.vendors ??
      []
    ).map((provider) => this.providerContext(provider));
    const providerUsage = (
      legacySnapshot.serviceProviderUsage ??
      legacySnapshot.serviceVendorUses ??
      []
    ).map((usage) => this.providerUsageContext(usage, providers));
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
      : [];
    const primaryService = services[0] ?? {};

    return {
      organization: organizationContext,
      company: organizationContext,
      policy: template
        ? this.policyContext(template, members, organization)
        : {},
      service: primaryService,
      services: {
        all: services,
        primary: primaryService,
        hasActivities: services.some(
          (service) =>
            Array.isArray(service.activities) && service.activities.length > 0,
        ),
        usesAi: services.some(
          (service) =>
            Array.isArray(service.activities) &&
            service.activities.some(
              (activity) =>
                (activity as Record<string, unknown>).usesAi === true,
            ),
        ),
        cookiesAnswered: services.some((service) => {
          const servicePrivacy = service.privacy as
            | Record<string, unknown>
            | undefined;
          return (
            servicePrivacy?.usesCookiesOrTrackingTechnologiesAnswered === true
          );
        }),
        hasHostingRegion: services.some((service) => {
          const servicePrivacy = service.privacy as
            | Record<string, unknown>
            | undefined;
          return Boolean(servicePrivacy?.primaryHostingRegionLabel);
        }),
        hasAllSubprocessorsDataRegion: services.some((service) => {
          const servicePrivacy = service.privacy as
            | Record<string, unknown>
            | undefined;
          return Boolean(servicePrivacy?.allSubprocessorsDataRegionLabel);
        }),
      },
      privacy: organization
        ? this.privacyContext(organization.privacy, vocabulary)
        : {},
      security: organization
        ? this.securityContext(
            organization.access,
            organization.infrastructure,
            organization.security,
            vocabulary,
          )
        : {},
      infrastructure: organization
        ? this.infrastructureContext(organization.infrastructure)
        : {},
      dataHandling: organization
        ? this.dataHandlingContext(organization.dataHandling, vocabulary)
        : {},
      access: organization ? this.withAnswerFlags(organization.access) : {},
      providers: this.providerGroups(services, providers, providerUsage),
      vendors: {
        ...this.providerGroups(services, providers, providerUsage),
      },
    };
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
        ["limited", "subprocessor"].includes(String(usage.dataProcessingLevel)),
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
    };
  }

  private policyContext(
    template: Template,
    members: OrganizationMember[],
    organization: OrganizationSecurityProfile | null,
  ) {
    // lastUpdatedDate is derived from when the organization's underlying data
    // last changed (not render time) so the document hash stays deterministic.
    const lastUpdatedDate = organization
      ? this.isoDateOnly(organization.updatedAt)
      : "";
    const effectiveDate = lastUpdatedDate;

    return {
      version: `${template.versionMajor}.${template.versionMinor}`,
      lastUpdatedDate,
      effectiveDate,
      ...this.answerFlags({ lastUpdatedDate, effectiveDate }),
    };
  }

  private isoDateOnly(value: string | null) {
    if (!value) {
      return "";
    }

    const separatorIndex = value.indexOf("T");
    return separatorIndex === -1 ? value : value.slice(0, separatorIndex);
  }

  private infrastructureContext(infrastructure: InfrastructureProfile) {
    return this.withAnswerFlags({
      ...infrastructure,
      organizationProviders: infrastructure.organizationProviders.filter(
        (provider) => provider.providerId !== "none",
      ),
    });
  }

  private dataHandlingContext(
    dataHandling: DataHandlingProfile,
    vocabulary?: Vocabulary,
  ) {
    return {
      ...this.withAnswerFlags(dataHandling),
      dataTypesStored: dataHandling.dataTypesStored.map((dataType) => ({
        ...dataType,
        subjectTypeLabels: this.codeLabels(
          vocabulary,
          "subject_types",
          dataType.subjectTypes,
        ),
        collectionMethodLabels: this.codeLabels(
          vocabulary,
          "collection_methods",
          dataType.collectionMethods,
        ),
      })),
    };
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
    );
    const analyticsProviders = serviceProviderUsage.filter(
      (usage) => usage.systemType === "analytics",
    );
    const advertisingProviders = serviceProviderUsage.filter(
      (usage) => usage.systemType === "advertising",
    );
    const allSubprocessorsDataRegion =
      this.allSubprocessorsDataRegion(serviceProviderUsage);
    const serviceActivities = activities
      .filter((activity) => service.businessActivityIds.includes(activity.id))
      .map((activity) =>
        this.businessActivityContext(activity, dataTypes, vocabulary),
      );
    const dataTypeNames = new Set(
      serviceProviderUsage.flatMap((usage) =>
        Array.isArray(usage.dataProcessed)
          ? usage.dataProcessed.map(String)
          : [],
      ),
    );
    const activityDataTypeIds = new Set(
      activities
        .filter((activity) => service.businessActivityIds.includes(activity.id))
        .flatMap((activity) => activity.dataTypeIds),
    );

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
        usesCookiesOrTrackingTechnologies:
          service.privacy.usesCookiesOrTrackingTechnologies,
        cookieTrackingCategories: service.privacy.cookieTrackingCategories,
        cookieTrackingCategoryLabels: this.codeLabels(
          vocabulary,
          "cookie_tracking_categories",
          service.privacy.cookieTrackingCategories,
        ),
        cookieConsentMechanism: service.privacy.cookieConsentMechanism,
        cookieConsentMechanismLabel: service.privacy.cookieConsentMechanism
          ? this.codeLabels(vocabulary, "privacy_cookie_consent_mechanisms", [
              service.privacy.cookieConsentMechanism,
            ])[0]
          : "",
        nonEssentialCookiesBlockedUntilConsent:
          service.privacy.nonEssentialCookiesBlockedUntilConsent,
        cookieRejectAsEasyAsAccept:
          service.privacy.cookieRejectAsEasyAsAccept,
        cookieConsentWithdrawalMethod:
          service.privacy.cookieConsentWithdrawalMethod,
        cookieConsentWithdrawalMethodLabel: service.privacy
          .cookieConsentWithdrawalMethod
          ? this.codeLabels(
              vocabulary,
              "privacy_cookie_consent_withdrawal_methods",
              [service.privacy.cookieConsentWithdrawalMethod],
            )[0]
          : "",
        cookieConsentNoPretickedBoxes:
          service.privacy.cookieConsentNoPretickedBoxes,
        doNotTrackResponse: service.privacy.doNotTrackResponse,
        globalPrivacyControlSupported:
          service.privacy.globalPrivacyControlSupported,
        analyticsProviders: this.providerNames(analyticsProviders),
        analyticsProviderIds: this.providerIds(analyticsProviders),
        advertisingProviders: this.providerNames(advertisingProviders),
        advertisingProviderIds: this.providerIds(advertisingProviders),
        primaryHostingRegion: service.privacy.primaryHostingRegion,
        primaryHostingRegionLabel: service.privacy.primaryHostingRegion
          ? this.codeLabels(vocabulary, "regions", [
              service.privacy.primaryHostingRegion,
            ])[0]
          : "",
        allSubprocessorsDataRegion,
        allSubprocessorsDataRegionLabel: allSubprocessorsDataRegion
          ? this.codeLabels(vocabulary, "regions", [
              allSubprocessorsDataRegion,
            ])[0]
          : "",
        ...this.answerFlags(service.privacy),
      },
      providerUsage: serviceProviderUsage,
      vendorUses: serviceProviderUsage,
      providers: serviceProviderUsage,
      vendors: serviceProviderUsage,
      subprocessors: serviceProviderUsage.filter(
        (usage) => usage.dataProcessingLevel === "subprocessor",
      ),
      dataTypes: dataTypes.filter(
        (dataType) =>
          dataTypeNames.has(String(dataType.name)) ||
          (dataType.id ? activityDataTypeIds.has(dataType.id) : false),
      ),
    };
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
      responseTimelineDaysStatus: privacy.responseTimelineDaysStatus,
      responseTimelineDaysStatusLabel: privacy.responseTimelineDaysStatus
        ? this.codeLabels(vocabulary, "defined_statuses", [
            privacy.responseTimelineDaysStatus,
          ])[0]
        : "",
      responseTimelineDays: privacy.responseTimelineDays,
      identityVerificationRequired: privacy.identityVerificationRequired,
      authorizedAgentSupported: privacy.authorizedAgentSupported,
      appealProcessExists: privacy.appealProcessExists,
      sendsMarketingEmails: privacy.sendsMarketingEmails,
      marketingOptOutMethod: privacy.marketingOptOutMethod,
      marketingOptOutMethodLabel: privacy.marketingOptOutMethod
        ? this.codeLabels(vocabulary, "privacy_marketing_opt_out_methods", [
            privacy.marketingOptOutMethod,
          ])[0]
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
      productionDataInDevelopment: privacy.productionDataInDevelopment,
      retentionPolicyExists: privacy.retentionPolicyExists,
      ...this.answerFlags(privacy),
    };
  }

  private providerIds(providers: Array<Record<string, unknown>>) {
    return providers.map((provider) =>
      String(provider.providerId ?? provider.organizationProviderId ?? ""),
    );
  }

  private providerNames(providers: Array<Record<string, unknown>>) {
    return providers.flatMap((provider) => {
      const id = String(
        provider.providerId ?? provider.organizationProviderId ?? "",
      );
      if (id === "none") {
        return [];
      }
      return [String(provider.name ?? provider.providerName ?? id ?? "")];
    });
  }

  private securityContext(
    access: AccessProfile,
    infrastructure: InfrastructureProfile,
    security: SecurityProfile,
    vocabulary?: Vocabulary,
  ) {
    const atRestAlgorithm =
      infrastructure.encryptionAtRest === true
        ? infrastructure.atRestAlgorithm
        : null;
    const inTransitMinimumTlsVersion =
      infrastructure.encryptionInTransit === true
        ? infrastructure.inTransitMinimumTlsVersion
        : null;

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
        atRestAlgorithm,
        atRestAlgorithmLabel: this.codeLabel(
          vocabulary,
          "security_encryption_algorithms",
          atRestAlgorithm,
        ),
        inTransitMinimumTlsVersion,
        inTransitMinimumTlsVersionLabel: this.codeLabel(
          vocabulary,
          "security_tls_versions",
          inTransitMinimumTlsVersion,
        ),
        keyManagementProvider: infrastructure.keyManagementProvider,
        keyManagementProviderLabel: this.codeLabel(
          vocabulary,
          "security_key_management_providers",
          infrastructure.keyManagementProvider,
        ),
        ...this.answerFlags({
          atRestAlgorithm,
          inTransitMinimumTlsVersion,
          keyManagementProvider: infrastructure.keyManagementProvider,
        }),
      },
      logging: {
        centralizedLogging: infrastructure.centralizedLoggingEnabled,
        securityMonitoring: infrastructure.securityMonitoring,
        securityMonitoringLabel: this.codeLabel(
          vocabulary,
          "security_monitoring_modes",
          infrastructure.securityMonitoring,
        ),
        ...this.answerFlags({
          centralizedLogging: infrastructure.centralizedLoggingEnabled,
          securityMonitoring: infrastructure.securityMonitoring,
        }),
      },
      developmentSecurity: {
        codeReviewRequired: security.codeReviewRequired,
        dependencySecurityMonitoring: security.dependencySecurityMonitoring,
        secretScanning: security.secretScanning,
        automatedTestingBeforeDeployment:
          security.automatedTestingBeforeDeployment,
        cicdDeploymentProcess: security.cicdDeploymentProcess,
        productionDeploymentApprovalRequired:
          security.productionDeploymentApprovalRequired,
        ...this.answerFlags({
          codeReviewRequired: security.codeReviewRequired,
          dependencySecurityMonitoring: security.dependencySecurityMonitoring,
          secretScanning: security.secretScanning,
          automatedTestingBeforeDeployment:
            security.automatedTestingBeforeDeployment,
          cicdDeploymentProcess: security.cicdDeploymentProcess,
          productionDeploymentApprovalRequired:
            security.productionDeploymentApprovalRequired,
        }),
      },
      vulnerabilityManagement: {
        scanningCadence: security.scanningCadence,
        scanningCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          security.scanningCadence,
        ),
        penetrationTestingStrategy: security.penetrationTestingStrategy,
        penetrationTestingStrategyLabel: this.codeLabel(
          vocabulary,
          "security_penetration_testing_strategies",
          security.penetrationTestingStrategy,
        ),
        penetrationTestingCadence: security.penetrationTestingCadence,
        penetrationTestingCadenceLabel: this.codeLabel(
          vocabulary,
          "security_cadences",
          security.penetrationTestingCadence,
        ),
        penetrationTestLastDate: security.penetrationTestLastDate,
        patchingSlaCriticalDays: security.patchingSlaCriticalDays,
        patchingSlaCriticalDaysStatus: security.patchingSlaCriticalDaysStatus,
        patchingSlaCriticalDaysStatusLabel: this.codeLabel(
          vocabulary,
          "defined_statuses",
          security.patchingSlaCriticalDaysStatus,
        ),
        patchingSlaHighDays: security.patchingSlaHighDays,
        patchingSlaHighDaysStatus: security.patchingSlaHighDaysStatus,
        patchingSlaHighDaysStatusLabel: this.codeLabel(
          vocabulary,
          "defined_statuses",
          security.patchingSlaHighDaysStatus,
        ),
        vulnerabilityDisclosureProgramExists:
          security.vulnerabilityDisclosureProgramExists,
        vulnerabilityDisclosureUrl: security.vulnerabilityDisclosureUrl,
        ...this.answerFlags({
          scanningCadence: security.scanningCadence,
          penetrationTestingStrategy: security.penetrationTestingStrategy,
          penetrationTestingCadence: security.penetrationTestingCadence,
          penetrationTestLastDate: security.penetrationTestLastDate,
          patchingSlaCriticalDays: security.patchingSlaCriticalDays,
          patchingSlaHighDays: security.patchingSlaHighDays,
          vulnerabilityDisclosureProgramExists:
            security.vulnerabilityDisclosureProgramExists,
          vulnerabilityDisclosureUrl: security.vulnerabilityDisclosureUrl,
        }),
      },
      incidentResponse: {
        planExists: security.incidentResponsePlanExists,
        notificationTimeline: security.incidentNotificationTimeline,
        notificationTimelineLabel: this.codeLabel(
          vocabulary,
          "security_notification_timelines",
          security.incidentNotificationTimeline,
        ),
        customerNotificationProcess: security.customerNotificationProcess,
        customerNotificationProcessLabel: this.codeLabel(
          vocabulary,
          "security_customer_notification_processes",
          security.customerNotificationProcess,
        ),
        lastTestedDate: security.incidentResponseLastTestedDate,
        ...this.answerFlags({
          planExists: security.incidentResponsePlanExists,
          notificationTimeline: security.incidentNotificationTimeline,
          customerNotificationProcess: security.customerNotificationProcess,
          lastTestedDate: security.incidentResponseLastTestedDate,
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
        backupRetentionDaysStatus: infrastructure.backupRetentionDaysStatus,
        backupRetentionDaysStatusLabel: this.codeLabel(
          vocabulary,
          "defined_statuses",
          infrastructure.backupRetentionDaysStatus,
        ),
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
    };
  }

  private codeLabels(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    values: string[] | null,
  ) {
    const codeSet = vocabulary?.codeSets.find(
      (currentCodeSet) => currentCodeSet.codeSetId === codeSetId,
    );

    return (values ?? []).flatMap((value) => {
      if (value === "none") {
        return [];
      }

      return [
        codeSet?.codes.find((code) => code.codeId === value)?.name ?? value,
      ];
    });
  }

  private codeLabel(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    value: string | null,
  ) {
    return value ? this.codeLabels(vocabulary, codeSetId, [value])[0] : "";
  }

  private withAnswerFlags<T extends Record<string, unknown>>(value: T) {
    return {
      ...value,
      ...this.answerFlags(value),
    };
  }

  private answerFlags(values: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => key !== "organizationProviders")
        .flatMap(([key, value]) => [
          [`${key}Answered`, this.answered(value)],
          [`${key}HasValue`, this.hasValue(value)],
        ]),
    );
  }

  private answered(value: unknown) {
    return value !== null && value !== undefined;
  }

  private hasValue(value: unknown) {
    if (!this.answered(value)) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true;
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
    };
  }

  private providerUsageContext(
    providerUsage: ServiceProviderUsage,
    providers: Array<Record<string, unknown>>,
  ) {
    const legacyUsage = providerUsage as ServiceProviderUsage & {
      vendorName?: string;
    };
    const provider =
      providers.find(
        (currentProvider) =>
          currentProvider.id === providerUsage.organizationProviderId,
      ) ?? {};

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
    };
  }

  private allSubprocessorsDataRegion(
    providerUsage: Array<Record<string, unknown>>,
  ) {
    const subprocessorRegions = providerUsage
      .filter((usage) => usage.dataProcessingLevel === "subprocessor")
      .map((usage) =>
        Array.isArray(usage.dataRegions) ? usage.dataRegions.map(String) : [],
      );

    if (
      subprocessorRegions.length === 0 ||
      subprocessorRegions.some((regions) => regions.length !== 1)
    ) {
      return "";
    }

    const uniqueRegions = new Set(subprocessorRegions.map(([region]) => region));
    return uniqueRegions.size === 1 ? [...uniqueRegions][0] : "";
  }

  private businessActivityContext(
    activity: BusinessActivity,
    dataTypes: StoredDataType[],
    vocabulary?: Vocabulary,
  ) {
    const activityDataTypes = dataTypes.filter((dataType) =>
      dataType.id ? activity.dataTypeIds.includes(dataType.id) : false,
    );

    return {
      id: activity.id,
      name: activity.name,
      purpose: activity.purpose,
      role: activity.role,
      roleLabel: activity.role
        ? (this.codeLabels(vocabulary, "activity_role", [activity.role])[0] ??
          activity.role)
        : "",
      legalBasis: activity.legalBasis,
      legalBasisLabels: this.codeLabels(
        vocabulary,
        "legal_basis",
        activity.legalBasis,
      ),
      dataTypeIds: activity.dataTypeIds,
      dataTypes: activityDataTypes,
      dataTypeNames: activityDataTypes.map((dataType) => dataType.name),
      retentionDays: activity.retentionDays,
      retentionPolicy: activity.retentionPolicy,
      retentionPolicyLabel: this.codeLabel(
        vocabulary,
        "activity_retention_policies",
        activity.retentionPolicy,
      ),
      retentionLabel:
        activity.retentionPolicy === "not_defined"
          ? "Not defined"
          : activity.retentionPolicy === "fixed" && activity.retentionDays > 0
            ? `${activity.retentionDays} days`
            : this.codeLabel(
                vocabulary,
                "activity_retention_policies",
                activity.retentionPolicy,
              ) || "Not set",
      usesAi: activity.usesAi,
      aiUseCases: activity.aiUseCases,
      aiCustomerDataUsedForTraining: activity.aiCustomerDataUsedForTraining,
      aiCustomerDataSentToProviders: activity.aiCustomerDataSentToProviders,
      aiHumanReviewOfOutputs: activity.aiHumanReviewOfOutputs,
      aiUsersInformedWhenUsed: activity.aiUsersInformedWhenUsed,
      ...this.answerFlags({
        usesAi: activity.usesAi,
        aiUseCases: activity.aiUseCases,
        aiCustomerDataUsedForTraining: activity.aiCustomerDataUsedForTraining,
        aiCustomerDataSentToProviders: activity.aiCustomerDataSentToProviders,
        aiHumanReviewOfOutputs: activity.aiHumanReviewOfOutputs,
        aiUsersInformedWhenUsed: activity.aiUsersInformedWhenUsed,
      }),
    };
  }

  private providersByService(
    services: Array<Record<string, unknown>>,
    providers: Array<Record<string, unknown>>,
  ) {
    return services.map((service) => {
      const activeProviders = providers.filter(
        (provider) =>
          provider.serviceId === service.id &&
          provider.dataProcessingLevel !== "none",
      );
      return {
        serviceId: service.id,
        serviceName: service.name,
        providers: activeProviders,
        vendors: activeProviders,
      };
    });
  }
}

export class Jinja2Renderer {
  render(template: Template, context: NormalizedTemplateContext): string {
    return nunjucks.renderString(template.content, context);
  }
}

export function templateSourceHash(
  template: Pick<Template, "content">,
  context: NormalizedTemplateContext,
) {
  return sourceHashFromFingerprint(documentSourceFingerprint(template, context));
}

export function documentSourceFingerprint(
  template: Pick<Template, "content">,
  context: NormalizedTemplateContext,
): DocumentSourceFingerprint {
  const paths = referencedTemplatePaths(template.content);

  return {
    version: 1,
    contentHash: hashValue(template.content),
    entries: paths.map((path) => {
      const value = valueAtPath(context, path);

      return {
        path,
        label: labelForPath(path),
        valueHash: hashValue(value),
        summary: summarizeValue(value),
      };
    }),
  };
}

export function sourceHashFromFingerprint(
  fingerprint: DocumentSourceFingerprint,
) {
  return hashValue({
    contentHash: fingerprint.contentHash,
    entries: fingerprint.entries.map((entry) => ({
      path: entry.path,
      valueHash: entry.valueHash,
    })),
  });
}

export function documentStaleReasons(
  previous: DocumentSourceFingerprint,
  current: DocumentSourceFingerprint,
) {
  const reasons: string[] = [];

  if (previous.contentHash !== current.contentHash) {
    return ["Template content changed."];
  }

  const previousEntries = new Map(
    previous.entries.map((entry) => [entry.path, entry]),
  );

  for (const entry of current.entries) {
    const previousEntry = previousEntries.get(entry.path);

    if (!previousEntry) {
      reasons.push(`${entry.label} changed.`);
      continue;
    }

    if (previousEntry.valueHash === entry.valueHash) {
      continue;
    }

    reasons.push(...reasonForChangedEntry(previousEntry, entry));
  }

  const uniqueReasons = Array.from(new Set(reasons));

  return uniqueReasons.filter((reason) => {
    if (!reason.endsWith(" changed.")) {
      return true;
    }

    const label = reason.slice(0, -" changed.".length);
    return !uniqueReasons.some((otherReason) =>
      otherReason.endsWith(` to ${label}.`),
    );
  });
}

export function evaluateDocumentFreshness({
  context,
  document,
  template,
}: {
  context: NormalizedTemplateContext;
  document: Pick<Document, "sourceHash" | "sourceFingerprint">;
  template: Pick<Template, "content">;
}) {
  const currentFingerprint = documentSourceFingerprint(template, context);
  const currentSourceHash = sourceHashFromFingerprint(currentFingerprint);

  return {
    status:
      document.sourceHash === currentSourceHash
        ? ("current" as const)
        : ("stale" as const),
    staleReasons:
      document.sourceHash === currentSourceHash
        ? []
        : documentStaleReasons(document.sourceFingerprint, currentFingerprint),
  };
}

export function referencedTemplatePaths(content: string): string[] {
  const ast = (
    nunjucks as typeof nunjucks & {
      parser: { parse: (source: string) => TemplateAstNode };
    }
  ).parser.parse(content);
  const paths = new Set<string>();

  collectReferencedPaths(ast, new Map(), paths);

  return Array.from(paths)
    .filter((path) => !path.startsWith("loop."))
    .sort();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashValue(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

type TemplateAstNode = {
  typename?: string;
  value?: unknown;
  target?: TemplateAstNode;
  val?: TemplateAstNode;
  arr?: TemplateAstNode;
  name?: TemplateAstNode;
  body?: TemplateAstNode;
  else_?: TemplateAstNode | null;
  children?: TemplateAstNode[];
  [key: string]: unknown;
};

function collectReferencedPaths(
  node: unknown,
  aliases: Map<string, string>,
  paths: Set<string>,
) {
  if (!node || typeof node !== "object") {
    return;
  }

  const astNode = node as TemplateAstNode;

  if (astNode.typename === "For") {
    const arrayPath = expressionPath(astNode.arr, aliases);
    if (arrayPath) {
      paths.add(arrayPath);
    }

    const scopedAliases = new Map(aliases);
    if (
      astNode.name?.typename === "Symbol" &&
      typeof astNode.name.value === "string" &&
      arrayPath
    ) {
      scopedAliases.set(astNode.name.value, arrayPath);
    }

    collectReferencedPaths(astNode.body, scopedAliases, paths);
    collectReferencedPaths(astNode.else_, aliases, paths);
    return;
  }

  if (astNode.typename === "LookupVal") {
    const path = expressionPath(astNode, aliases);
    if (path) {
      paths.add(path);
    }
    return;
  }

  if (astNode.typename === "Symbol" && typeof astNode.value === "string") {
    const aliasPath = aliases.get(astNode.value);
    if (aliasPath) {
      paths.add(aliasPath);
    }
    return;
  }

  for (const value of Object.values(astNode)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        collectReferencedPaths(child, aliases, paths);
      }
    } else if (value && typeof value === "object") {
      collectReferencedPaths(value, aliases, paths);
    }
  }
}

function expressionPath(
  node: TemplateAstNode | undefined,
  aliases: Map<string, string>,
): string | null {
  if (!node) {
    return null;
  }

  if (node.typename === "Symbol" && typeof node.value === "string") {
    return aliases.get(node.value) ?? node.value;
  }

  if (node.typename === "LookupVal") {
    const targetPath = expressionPath(node.target, aliases);
    const key = lookupKey(node.val);

    return targetPath && key ? `${targetPath}.${key}` : targetPath;
  }

  return null;
}

function lookupKey(node: TemplateAstNode | undefined) {
  if (!node) {
    return null;
  }

  if (typeof node.value === "string") {
    return node.value;
  }

  return null;
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      return current.map((item) => valueAtPath(item, key));
    }

    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}

function summarizeValue(value: unknown) {
  return {
    display: displaySummary(value),
    names: collectNames(value),
  };
}

function displaySummary(value: unknown): string {
  if (Array.isArray(value)) {
    const names = collectNames(value);
    if (names.length > 0) {
      return names.slice(0, 4).join(", ");
    }

    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "Updated";
}

function collectNames(value: unknown): string[] {
  const names = new Set<string>();
  collectNamesInto(value, names, true);
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function collectNamesInto(
  value: unknown,
  names: Set<string>,
  includePrimitiveStrings: boolean,
) {
  if (
    includePrimitiveStrings &&
    typeof value === "string" &&
    value.trim()
  ) {
    names.add(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    const primitiveStringArray = value.every(
      (item) => typeof item === "string",
    );
    for (const item of value) {
      collectNamesInto(
        item,
        names,
        includePrimitiveStrings && primitiveStringArray,
      );
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.name === "string" && record.name.trim()) {
    names.add(record.name.trim());
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    if (key === "name") {
      continue;
    }
    collectNamesInto(nestedValue, names, false);
  }
}

function reasonForChangedEntry(
  previous: DocumentSourceFingerprint["entries"][number],
  current: DocumentSourceFingerprint["entries"][number],
) {
  const addedNames = current.summary.names.filter(
    (name) => !previous.summary.names.includes(name),
  );
  const removedNames = previous.summary.names.filter(
    (name) => !current.summary.names.includes(name),
  );
  const reasons: string[] = [];

  if (isProviderPath(current.path)) {
    reasons.push(
      ...addedNames.map((name) => `${name} added to ${current.label}.`),
      ...removedNames.map((name) => `${name} removed from ${current.label}.`),
    );
  }

  if (reasons.length > 0) {
    return reasons;
  }

  return [`${current.label} changed.`];
}

function isProviderPath(path: string) {
  return path.startsWith("vendors.") || path.startsWith("providers.");
}

function labelForPath(path: string) {
  const exactLabels: Record<string, string> = {
    "vendors.byService": "subprocessor list",
    "vendors.dataProcessors": "processor list",
    "vendors.subprocessors": "subprocessor list",
    "providers.byService": "subprocessor list",
    "providers.dataProcessors": "processor list",
    "providers.subprocessors": "subprocessor list",
    "privacy.supportedRightLabels": "Privacy rights",
    "service.privacy.primaryHostingRegionLabel": "Primary hosting region",
    "services.all.privacy.primaryHostingRegionLabel": "Primary hosting region",
  };

  if (exactLabels[path]) {
    return exactLabels[path];
  }

  const providerPrefix = [
    "vendors.byService.",
    "vendors.subprocessors.",
    "providers.byService.",
    "providers.subprocessors.",
  ].find((prefix) => path.startsWith(prefix));

  if (providerPrefix) {
    return "subprocessor list";
  }

  const lastSegment = path.split(".").at(-1) ?? path;
  return lastSegment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
