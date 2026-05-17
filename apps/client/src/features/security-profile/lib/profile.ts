import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  type OrganizationSecurityProfile,
  type Provider,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

export const emptyProfileDraft: ProfileDraft = {
  company: emptyCompanyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: emptyDataHandlingProfile,
  access: emptyAccessProfile,
}

export const emptyVendorDraft: VendorInput = {
  name: "",
  category: "",
  purpose: "",
  countryOfRegistration: "",
  hasSubprocessors: false,
  dataProcessingLevel: "none",
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
  criticality: "medium",
  owner: "",
  notes: "",
}

export const profileFromOrganization = (
  organization: OrganizationSecurityProfile | null
): ProfileDraft => {
  if (!organization) {
    return emptyProfileDraft
  }

  return {
    company: organization.company,
    infrastructure: organization.infrastructure,
    dataHandling: organization.dataHandling,
    access: organization.access,
  }
}

export const toVendorInput = (vendor: Vendor | VendorInput): VendorInput => ({
  name: vendor.name,
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
})

export const dataTypeOptionsFromProfile = (
  dataTypes: ProfileDraft["dataHandling"]["dataTypesStored"]
) =>
  Array.from(
    new Map(
      dataTypes
        .map((dataType) => ({
          name: dataType.name.trim(),
          description: dataType.description.trim(),
        }))
        .filter((dataType) => dataType.name)
        .map((dataType) => [
          dataType.name,
          {
            value: dataType.name,
            label: dataType.description
              ? `${dataType.name} - ${dataType.description}`
              : dataType.name,
          },
        ])
    ).values()
  )

const providerCriticality = (
  provider: Provider
): VendorInput["criticality"] => {
  const normalizedCriticality = provider.securityCriticality?.toLowerCase()

  if (
    normalizedCriticality === "critical" ||
    normalizedCriticality === "high"
  ) {
    return "high"
  }

  if (normalizedCriticality === "low") {
    return "low"
  }

  return "medium"
}

const providerCategory = (provider: Provider): VendorInput["category"] => {
  const normalizedCategory = provider.category?.trim().toLowerCase()

  if (normalizedCategory === "source control") {
    return "source_control"
  }

  if (normalizedCategory === "payments") {
    return "payments"
  }

  if (normalizedCategory === "project management") {
    return "project_management"
  }

  return "provider"
}

export const vendorInputFromProvider = (provider: Provider): VendorInput => ({
  name: provider.name,
  category: providerCategory(provider),
  purpose: provider.url
    ? `Operational provider listed at ${provider.url}`
    : "Operational provider",
  countryOfRegistration: "",
  hasSubprocessors: false,
  dataProcessingLevel: provider.handlesCustomerData ? "limited" : "none",
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
  criticality: providerCriticality(provider),
  owner: "",
  notes: provider.securityCriticality
    ? `Provider catalog criticality: ${provider.securityCriticality}`
    : "",
})
