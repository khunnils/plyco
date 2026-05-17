import {
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type VendorInput,
} from "@complyflow/shared"

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
    await assertCode(
      vocabularyRepository,
      organizationId,
      "data_categories",
      dataType.name,
      "dataHandling.dataTypesStored.name",
    )
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
        "data_purposes",
        dataType.purposes,
        "dataHandling.dataTypesStored.purposes",
      ),
      assertCodes(
        vocabularyRepository,
        organizationId,
        "collection_methods",
        dataType.collectionMethods,
        "dataHandling.dataTypesStored.collectionMethods",
      ),
      assertCodes(
        vocabularyRepository,
        organizationId,
        "legal_basis",
        dataType.legalBasis,
        "dataHandling.dataTypesStored.legalBasis",
      ),
    ])
  }
}

export const validateInfrastructureProfileCodes = async (
  vocabularyRepository: VocabularyRepository,
  organizationId: string,
  infrastructure: InfrastructureProfile,
) => {
  await Promise.all(
    infrastructure.organizationProviders.map((provider) =>
      assertCode(
        vocabularyRepository,
        organizationId,
        "provider_system_type",
        provider.systemType,
        "infrastructure.organizationProviders.systemType",
      ),
    ),
  )
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
    assertCode(
      vocabularyRepository,
      organizationId,
      "vendor_category",
      vendor.category,
      "vendor.category",
    ),
    assertCode(
      vocabularyRepository,
      organizationId,
      "data_processing_level",
      vendor.dataProcessingLevel,
      "vendor.dataProcessingLevel",
    ),
    assertCode(
      vocabularyRepository,
      organizationId,
      "dpa_status",
      vendor.dpaStatus,
      "vendor.dpaStatus",
    ),
    assertCodes(
      vocabularyRepository,
      organizationId,
      "regions",
      vendor.dataRegions,
      "vendor.dataRegions",
    ),
    assertCode(
      vocabularyRepository,
      organizationId,
      "vendor_criticality",
      vendor.criticality,
      "vendor.criticality",
    ),
  ])
}
