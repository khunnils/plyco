import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  type OrganizationSecurityProfile,
  type Provider,
  type Vendor,
  type VendorInput,
} from "@plyco/shared"

import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

export const emptyProfileDraft: ProfileDraft = {
  company: emptyCompanyProfile,
  services: [emptyServiceProfile],
  privacy: emptyPrivacyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: emptyDataHandlingProfile,
  access: emptyAccessProfile,
}

export const emptyVendorDraft: VendorInput = {
  name: "",
  category: "",
  serviceId: "",
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
    company: { ...emptyCompanyProfile, ...organization.company },
    services:
      organization.services.length > 0
        ? organization.services.map((service) => ({
            id: service.id,
            serviceName: service.serviceName,
            serviceDescription: service.serviceDescription,
            serviceUrl: service.serviceUrl,
            userTypes: service.userTypes,
            customerTypes: service.customerTypes,
            availabilityRegions: service.availabilityRegions,
            childrenDirected: service.childrenDirected,
            minimumUserAge: service.minimumUserAge,
          }))
        : [emptyServiceProfile],
    privacy: { ...emptyPrivacyProfile, ...organization.privacy },
    infrastructure: {
      ...emptyInfrastructureProfile,
      ...organization.infrastructure,
    },
    dataHandling: { ...emptyDataHandlingProfile, ...organization.dataHandling },
    access: { ...emptyAccessProfile, ...organization.access },
  }
}

export const toVendorInput = (vendor: Vendor | VendorInput): VendorInput => ({
  serviceId: vendor.serviceId,
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

  return ""
}

export const vendorInputFromProvider = (
  provider: Provider,
  serviceId: string,
): VendorInput => ({
  serviceId,
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
