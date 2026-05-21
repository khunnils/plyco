import {
  type AccessProfile,
  type BusinessActivityInput,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type PrivacyProfile,
  type ServiceProfileInput,
  type ServiceVendorUseInput,
  type VendorInput,
} from "@plyco/shared"

import { ApiError } from "../../errors.js"
import { type VocabularyRepository } from "./repository.js"

const assertCountry = async (
  vocabularyRepository: VocabularyRepository,
  field: string,
  value: string,
) => {
  if (!value) {
    return
  }

  if (!(await vocabularyRepository.countryExists(value))) {
    throw new ApiError(
      "COUNTRY_NOT_FOUND",
      "Selected country is not available.",
      400,
      { field, value },
    )
  }
}

const assertCode = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  codeSetId: string,
  value: string,
  field: string,
) => {
  if (!(await vocabularyRepository.codeExists(organizationId, codeSetId, value))) {
    throw new ApiError(
      "CODE_NOT_FOUND",
      "Selected code is not available.",
      400,
      { codeSetId, field, value },
    )
  }
}

const assertCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  codeSetId: string,
  values: string[],
  field: string,
) => {
  await Promise.all(
    Array.from(new Set(values)).map((value) =>
      assertCode(vocabularyRepository, organizationId, codeSetId, value, field),
    ),
  )
}

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
  ])
}

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
    ])
  }
}

export const validateBusinessActivityCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  activity: BusinessActivityInput,
) => {
  await Promise.all([
    assertCodes(
      vocabularyRepository,
      organizationId,
      "data_purposes",
      activity.purposes,
      "businessActivity.purposes",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "legal_basis",
      activity.legalBasis,
      "businessActivity.legalBasis",
    ),
  ])
}

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
        )
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        "infrastructure.organizationProviders.systemType",
      )
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
  ])
}

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
  ])
}

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
      "privacy_cookie_types",
      service.privacy.cookieTypes,
      `${fieldPrefix}.privacy.cookieTypes`,
    ),
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
    ...service.privacy.analyticsProviders.map((provider) => {
      if (provider.systemType !== "analytics") {
        throw new ApiError(
          "SERVICE_PROVIDER_SYSTEM_TYPE_INVALID",
          "Service analytics providers must use analytics system type.",
          400,
          { systemType: provider.systemType },
        )
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        `${fieldPrefix}.privacy.analyticsProviders.systemType`,
      )
    }),
    ...service.privacy.advertisingProviders.map((provider) => {
      if (provider.systemType !== "advertising") {
        throw new ApiError(
          "SERVICE_PROVIDER_SYSTEM_TYPE_INVALID",
          "Service advertising providers must use advertising system type.",
          400,
          { systemType: provider.systemType },
        )
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        `${fieldPrefix}.privacy.advertisingProviders.systemType`,
      )
    }),
  ])
}

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
    privacy.cookieConsentMechanism
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "privacy_cookie_consent_mechanisms",
          privacy.cookieConsentMechanism,
          "privacy.cookieConsentMechanism",
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
        )
      }

      return assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        "privacy.organizationProviders.systemType",
      )
    }),
  ])
}

export const validateVendorCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  vendor: VendorInput,
) => {
  await Promise.all([
    assertCountry(
      vocabularyRepository,
      "vendor.countryOfRegistration",
      vendor.countryOfRegistration,
    ),
    vendor.category
      ? assertCode(
          vocabularyRepository,
          organizationId,
          "vendor_category",
          vendor.category,
          "vendor.category",
        )
      : Promise.resolve(),
    assertCode(
      vocabularyRepository,
      organizationId,
      "vendor_criticality",
      vendor.criticality,
      "vendor.criticality",
    ),
  ])
}

export const validateServiceVendorUseCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  vendorUse: ServiceVendorUseInput,
) => {
  await Promise.all([
    assertCode(
      vocabularyRepository,
      organizationId,
      "data_processing_level",
      vendorUse.dataProcessingLevel,
      "serviceVendorUse.dataProcessingLevel",
    ),
    assertCode(
      vocabularyRepository,
      organizationId,
      "dpa_status",
      vendorUse.dpaStatus,
      "serviceVendorUse.dpaStatus",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      vendorUse.dataRegions,
      "serviceVendorUse.dataRegions",
    ),
  ])
}
