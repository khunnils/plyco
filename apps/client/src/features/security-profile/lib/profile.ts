import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  type OrganizationSecurityProfile,
  type Provider,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
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
  legalName: "",
  displayName: "",
  providerOrganizationName: "",
  providerOrganizationLegalName: "",
  privacyPolicyUrl: "",
  dpaUrl: "",
  securityPageUrl: "",
  category: "",
  countryOfRegistration: "",
  hasSubprocessors: false,
  criticality: "medium",
  owner: "",
  notes: "",
}

export const emptyServiceVendorUseDraft: ServiceVendorUseInput = {
  serviceId: "",
  vendorId: "",
  purpose: "",
  dataProcessingLevel: "none",
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
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
            businessActivityIds: service.businessActivityIds,
            userTypes: service.userTypes,
            customerTypes: service.customerTypes,
            availabilityRegions: service.availabilityRegions,
            childrenDirected: service.childrenDirected,
            minimumUserAge: service.minimumUserAge,
            privacy: service.privacy,
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
  name: vendor.name,
  legalName: vendor.legalName,
  displayName: vendor.displayName,
  providerOrganizationName: vendor.providerOrganizationName,
  providerOrganizationLegalName: vendor.providerOrganizationLegalName,
  privacyPolicyUrl: vendor.privacyPolicyUrl,
  dpaUrl: vendor.dpaUrl,
  securityPageUrl: vendor.securityPageUrl,
  category: vendor.category,
  countryOfRegistration: vendor.countryOfRegistration,
  hasSubprocessors: vendor.hasSubprocessors,
  criticality: vendor.criticality,
  owner: vendor.owner,
  notes: vendor.notes,
})

export const toServiceVendorUseInput = (
  vendorUse: ServiceVendorUse | ServiceVendorUseInput
): ServiceVendorUseInput => ({
  serviceId: vendorUse.serviceId,
  vendorId: vendorUse.vendorId,
  purpose: vendorUse.purpose,
  dataProcessingLevel: vendorUse.dataProcessingLevel,
  dataProcessed: vendorUse.dataProcessed,
  dpaStatus: vendorUse.dpaStatus,
  dataRegions: vendorUse.dataRegions,
  notes: vendorUse.notes,
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
): VendorInput => ({
  name: provider.name,
  legalName: "",
  displayName: provider.name,
  providerOrganizationName: provider.name,
  providerOrganizationLegalName: "",
  privacyPolicyUrl: provider.url ?? "",
  dpaUrl: "",
  securityPageUrl: "",
  category: providerCategory(provider),
  countryOfRegistration: "",
  hasSubprocessors: false,
  criticality: providerCriticality(provider),
  owner: "",
  notes: provider.securityCriticality
    ? `Provider catalog criticality: ${provider.securityCriticality}`
    : "",
})
