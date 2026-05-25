import {
  type AccessProfile,
  type BusinessActivityInput,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type PrivacyProfile,
  type ServiceProfileInput,
  type ServiceProviderUsageInput,
  type OrganizationProviderInput,
} from "@plyco/shared";

import { ApiError } from "../../errors.js";
import { type VocabularyRepository } from "./repository.js";

const assertCountry = async (
  vocabularyRepository: VocabularyRepository,
  field: string,
  value: string | null,
) => {
  if (!value) {
    return;
  }

  if (!(await vocabularyRepository.countryExists(value))) {
    throw new ApiError(
      "COUNTRY_NOT_FOUND",
      "Selected country is not available.",
      400,
      { field, value },
    );
  }
};

const assertCode = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  codeSetId: string,
  value: string,
  field: string,
) => {
  if (
    !(await vocabularyRepository.codeExists(organizationId, codeSetId, value))
  ) {
    throw new ApiError(
      "CODE_NOT_FOUND",
      "Selected code is not available.",
      400,
      { codeSetId, field, value },
    );
  }
};

const assertCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  codeSetId: string,
  values: string[] | null,
  field: string,
) => {
  if (!values) {
    return;
  }

  await Promise.all(
    Array.from(new Set(values)).map((value) =>
      assertCode(vocabularyRepository, organizationId, codeSetId, value, field),
    ),
  );
};

export const validateCompanyProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  company: CompanyProfile,
) => {
  await Promise.all([
    assertCountry(vocabularyRepository, "company.country", company.country),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "industries",
      company.industries,
      "company.industries",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      company.regions,
      "company.regions",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "compliance_goals",
      company.complianceGoals,
      "company.complianceGoals",
    ),
  ]);
};

export const validateDataHandlingProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  dataHandling: DataHandlingProfile,
) => {
  for (const dataType of dataHandling.dataTypesStored) {
    await Promise.all([
      assertCodes(
        vocabularyRepository,
        organizationId,
        "subject_types",
        dataType.subjectTypes,
        "dataHandling.dataTypesStored.subjectTypes",
      ),
      assertCodes(
        vocabularyRepository,
        organizationId,
        "collection_methods",
        dataType.collectionMethods,
        "dataHandling.dataTypesStored.collectionMethods",
      ),
    ]);
  }
};

export const validateBusinessActivityCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  activity: BusinessActivityInput,
) => {
  await Promise.all([
    activity.role
      ? assertCodes(
          vocabularyRepository,
          organizationId,
          "activity_role",
          [activity.role],
          "businessActivity.role",
        )
      : Promise.resolve(),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "legal_basis",
      activity.legalBasis,
      "businessActivity.legalBasis",
    ),
    activity.retentionPolicy
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "activity_retention_policies",
          activity.retentionPolicy,
          "businessActivity.retentionPolicy",
        )
      : Promise.resolve(),
  ]);
};

export const validateInfrastructureProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  infrastructure: InfrastructureProfile,
) => {
  await Promise.all([
    ...infrastructure.organizationProviders.map((provider) => {
      if (
        !["auth", "source_control", "cloud", "password_manager"].includes(
          provider.systemType,
        )
      ) {
        throw new ApiError(
          "INFRASTRUCTURE_PROVIDER_SYSTEM_TYPE_INVALID",
          "Infrastructure providers must use cloud, source control, auth, or password manager system types.",
          400,
          { systemType: provider.systemType },
        );
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        "infrastructure.organizationProviders.systemType",
      );
    }),
    infrastructure.atRestAlgorithm
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_encryption_algorithms",
          infrastructure.atRestAlgorithm,
          "infrastructure.atRestAlgorithm",
        )
      : Promise.resolve(),
    infrastructure.inTransitMinimumTlsVersion
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_tls_versions",
          infrastructure.inTransitMinimumTlsVersion,
          "infrastructure.inTransitMinimumTlsVersion",
        )
      : Promise.resolve(),
    infrastructure.keyManagementProvider
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_key_management_providers",
          infrastructure.keyManagementProvider,
          "infrastructure.keyManagementProvider",
        )
      : Promise.resolve(),
    infrastructure.logRetentionDaysStatus
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "defined_statuses",
          infrastructure.logRetentionDaysStatus,
          "infrastructure.logRetentionDaysStatus",
        )
      : Promise.resolve(),
    infrastructure.patchingSlaCriticalDaysStatus
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "defined_statuses",
          infrastructure.patchingSlaCriticalDaysStatus,
          "infrastructure.patchingSlaCriticalDaysStatus",
        )
      : Promise.resolve(),
    infrastructure.patchingSlaHighDaysStatus
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "defined_statuses",
          infrastructure.patchingSlaHighDaysStatus,
          "infrastructure.patchingSlaHighDaysStatus",
        )
      : Promise.resolve(),
    infrastructure.backupRetentionDaysStatus
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "defined_statuses",
          infrastructure.backupRetentionDaysStatus,
          "infrastructure.backupRetentionDaysStatus",
        )
      : Promise.resolve(),
    infrastructure.securityMonitoringOwner
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_monitoring_owners",
          infrastructure.securityMonitoringOwner,
          "infrastructure.securityMonitoringOwner",
        )
      : Promise.resolve(),
    infrastructure.scanningCadence
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_cadences",
          infrastructure.scanningCadence,
          "infrastructure.scanningCadence",
        )
      : Promise.resolve(),
    infrastructure.incidentNotificationTimeline
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_notification_timelines",
          infrastructure.incidentNotificationTimeline,
          "infrastructure.incidentNotificationTimeline",
        )
      : Promise.resolve(),
    infrastructure.customerNotificationProcess
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_customer_notification_processes",
          infrastructure.customerNotificationProcess,
          "infrastructure.customerNotificationProcess",
        )
      : Promise.resolve(),
    infrastructure.backupCadence
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_cadences",
          infrastructure.backupCadence,
          "infrastructure.backupCadence",
        )
      : Promise.resolve(),
    infrastructure.restoreTestingCadence
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_cadences",
          infrastructure.restoreTestingCadence,
          "infrastructure.restoreTestingCadence",
        )
      : Promise.resolve(),
    infrastructure.vendorReviewCadence
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_cadences",
          infrastructure.vendorReviewCadence,
          "infrastructure.vendorReviewCadence",
        )
      : Promise.resolve(),
  ]);
};

export const validateAccessProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  access: AccessProfile,
) => {
  await Promise.all([
    access.accessReviewCadence
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "security_cadences",
          access.accessReviewCadence,
          "access.accessReviewCadence",
        )
      : Promise.resolve(),
  ]);
};

export const validateServiceProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  service: ServiceProfileInput,
  fieldPrefix = "service",
) => {
  await Promise.all([
    assertCodes(
      vocabularyRepository,
      organizationId,
      "service_user_types",
      service.userTypes,
      `${fieldPrefix}.userTypes`,
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "service_customer_types",
      service.customerTypes,
      `${fieldPrefix}.customerTypes`,
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      service.availabilityRegions,
      `${fieldPrefix}.availabilityRegions`,
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "cookie_tracking_categories",
      service.privacy.cookieTrackingCategories,
      `${fieldPrefix}.privacy.cookieTrackingCategories`,
    ),
    service.privacy.cookieConsentMechanism
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "privacy_cookie_consent_mechanisms",
          service.privacy.cookieConsentMechanism,
          `${fieldPrefix}.privacy.cookieConsentMechanism`,
        )
      : Promise.resolve(),
    service.privacy.primaryHostingRegion
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "regions",
          service.privacy.primaryHostingRegion,
          `${fieldPrefix}.privacy.primaryHostingRegion`,
        )
      : Promise.resolve(),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      service.privacy.dataResidencyOptions,
      `${fieldPrefix}.privacy.dataResidencyOptions`,
    ),
  ]);
};

export const validatePrivacyProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  privacy: PrivacyProfile,
) => {
  await Promise.all([
    assertCodes(
      vocabularyRepository,
      organizationId,
      "privacy_supported_rights",
      privacy.supportedRights,
      "privacy.supportedRights",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "privacy_request_methods",
      privacy.requestMethods,
      "privacy.requestMethods",
    ),
    privacy.responseTimelineDaysStatus
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "defined_statuses",
          privacy.responseTimelineDaysStatus,
          "privacy.responseTimelineDaysStatus",
        )
      : Promise.resolve(),
    privacy.marketingOptOutMethod
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "privacy_marketing_opt_out_methods",
          privacy.marketingOptOutMethod,
          "privacy.marketingOptOutMethod",
        )
      : Promise.resolve(),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "privacy_transfer_mechanisms",
      privacy.transferMechanisms,
      "privacy.transferMechanisms",
    ),
    ...privacy.organizationProviders.map((provider) => {
      if (provider.systemType !== "newsletter") {
        throw new ApiError(
          "PRIVACY_PROVIDER_SYSTEM_TYPE_INVALID",
          "Privacy providers must use newsletter system type.",
          400,
          { systemType: provider.systemType },
        );
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        "privacy.organizationProviders.systemType",
      );
    }),
  ]);
};

export const validateOrganizationProviderCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  provider: OrganizationProviderInput,
) => {
  await Promise.all([
    assertCountry(
      vocabularyRepository,
      "provider.countryOfRegistration",
      provider.countryOfRegistration,
    ),
    provider.category
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "vendor_category",
          provider.category,
          "provider.category",
        )
      : Promise.resolve(),
    assertCode(
      vocabularyRepository,
      organizationId,
      "vendor_criticality",
      provider.criticality,
      "provider.criticality",
    ),
  ]);
};

export const validateServiceProviderUsageCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  providerUsage: ServiceProviderUsageInput,
) => {
  await Promise.all([
    assertCode(
      vocabularyRepository,
      organizationId,
      "data_processing_level",
      providerUsage.dataProcessingLevel,
      "serviceProviderUsage.dataProcessingLevel",
    ),
    assertCode(
      vocabularyRepository,
      organizationId,
      "dpa_status",
      providerUsage.dpaStatus,
      "serviceProviderUsage.dpaStatus",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      providerUsage.dataRegions,
      "serviceProviderUsage.dataRegions",
    ),
    providerUsage.systemType
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "provider_system_type",
          providerUsage.systemType,
          "serviceProviderUsage.systemType",
        )
      : Promise.resolve(),
  ]);
};
