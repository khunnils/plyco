import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  type OrganizationProvider,
  type OrganizationProviderInput,
  type OrganizationSecurityProfile,
  type Provider,
  type ProviderSystemType,
  type ProviderSelection,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
} from "@plyco/shared"

import { type ProfileDraft } from "@/features/company/types/company"

export const emptyProfileDraft: ProfileDraft = {
  company: emptyCompanyProfile,
  services: [emptyServiceProfile],
  privacy: emptyPrivacyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: emptyDataHandlingProfile,
  access: emptyAccessProfile,
}

export const emptyOrganizationProviderDraft: OrganizationProviderInput = {
  providerId: "",
  systemTypes: [],
  name: "",
  legalName: "",
  category: "",
  countryOfRegistration: "",
  criticality: "medium",
  notes: "",
  purpose: "",
}

export const emptyServiceProviderUsageDraft: ServiceProviderUsageInput = {
  serviceId: "",
  organizationProviderId: "",
  systemType: null,
  purpose: "",
  dataProcessingLevel: "not_set",
  dataProcessed: [],
  dpaStatus: null,
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
            sortOrder: service.sortOrder,
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

export const toOrganizationProviderInput = (
  provider: OrganizationProvider | OrganizationProviderInput
): OrganizationProviderInput => ({
  providerId: provider.providerId,
  systemTypes: provider.systemTypes,
  name: provider.name,
  legalName: provider.legalName,
  category: provider.category,
  countryOfRegistration: provider.countryOfRegistration,
  criticality: provider.criticality,
  notes: provider.notes,
  purpose: provider.purpose,
})

export const toServiceProviderUsageInput = (
  providerUsage: ServiceProviderUsage | ServiceProviderUsageInput
): ServiceProviderUsageInput => ({
  serviceId: providerUsage.serviceId,
  organizationProviderId: providerUsage.organizationProviderId,
  systemType: providerUsage.systemType,
  purpose: providerUsage.purpose,
  dataProcessingLevel: providerUsage.dataProcessingLevel,
  dataProcessed: providerUsage.dataProcessed,
  dpaStatus: providerUsage.dpaStatus,
  dataRegions: providerUsage.dataRegions,
  notes: providerUsage.notes,
})

export const dataTypeOptionsFromProfile = (
  dataTypes: ProfileDraft["dataHandling"]["dataTypesStored"]
) =>
  Array.from(
    new Map(
      dataTypes
        .map((dataType) => ({
          name: dataType.name.trim(),
          description: dataType.description?.trim() ?? "",
        }))
        .filter((dataType) => dataType.name)
        .map((dataType) => [
          dataType.name,
          {
            value: dataType.name,
            label: dataType.name,
          },
        ])
    ).values()
  )

const providerCriticality = (
  provider: Provider
): OrganizationProviderInput["criticality"] => {
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

const providerCategory = (
  provider: Provider
): OrganizationProviderInput["category"] => {
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

const valueList = (values: string[] | null) =>
  values && values.length > 0 ? values.join(", ") : "Not set"

export const providerNamesForSystem = (
  organizationProviders: ProviderSelection[],
  providers: Provider[],
  systemType: ProviderSystemType
) => {
  const names = organizationProviders
    .filter((provider) => provider.systemType === systemType)
    .map((provider) => {
      if (provider.providerId === "none") {
        return "None"
      }
      const catalogProvider = providers.find(
        (catalogProvider) => catalogProvider.id === provider.providerId
      )

      return catalogProvider?.name ?? provider.name ?? provider.providerId
    })

  return valueList(names)
}

export const organizationProviderInputFromProvider = (
  provider: Provider
): OrganizationProviderInput => ({
  providerId: provider.id,
  systemTypes: [],
  name: provider.name,
  legalName: provider.legalName || "",
  category: provider.categoryCode || providerCategory(provider) || "",
  countryOfRegistration: provider.countryOfRegistration || "",
  criticality: providerCriticality(provider),
  notes: "",
  purpose: provider.purpose || "",
})
