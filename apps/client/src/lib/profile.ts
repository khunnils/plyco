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

import { type ProfileDraft } from "@/types/security-profile"

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
  hasSubprocessors: false,
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
  hasSubprocessors: vendor.hasSubprocessors,
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

export const vendorInputFromProvider = (provider: Provider): VendorInput => ({
  name: provider.name,
  category: provider.category ?? "Provider",
  purpose: provider.url
    ? `Operational provider listed at ${provider.url}`
    : "Operational provider",
  hasSubprocessors: false,
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
  criticality: providerCriticality(provider),
  owner: "",
  notes: provider.securityCriticality
    ? `Provider catalog criticality: ${provider.securityCriticality}`
    : "",
})
