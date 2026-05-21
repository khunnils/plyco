import {
  type OrganizationProvider,
  type OrganizationSecurityProfile,
  type Provider,
  type ServiceProfile,
  type ServiceProfileInput,
} from "@plyco/shared"

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js"
import { ApiError } from "../../errors.js"

function now() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private organizations = new Map<string, OrganizationSecurityProfile>()

  async getOrganization(
    organizationId: string,
  ): Promise<OrganizationSecurityProfile | null> {
    return this.organizations.get(organizationId) ?? null
  }

  async upsertProfile(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now()
    const existing = this.organizations.get(organizationId)
    const inputWithProviderNames = this.withProviderNames(input, providerCatalog)
    const services = this.servicesWithIds(
      inputWithProviderNames.services,
      existing?.services ?? [],
      timestamp,
    )
    const organization: OrganizationSecurityProfile = {
      id: organizationId,
      ...inputWithProviderNames,
      services,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    this.organizations.set(organizationId, organization)
    return organization
  }

  async listDataTypeNames(organizationId: string): Promise<string[]> {
    return (
      this.organizations
        .get(organizationId)
        ?.dataHandling.dataTypesStored.map(
        (dataType) => dataType.name,
      ) ?? []
    )
  }

  async listServiceIds(organizationId: string): Promise<string[]> {
    return this.organizations.get(organizationId)?.services.map((service) => service.id) ?? []
  }

  private servicesWithIds(
    inputServices: ServiceProfileInput[],
    existingServices: ServiceProfile[],
    timestamp: string,
  ): ServiceProfile[] {
    return inputServices.map((service, index) => {
      const serviceId = service.id ?? existingServices[index]?.id
      const existingService = service.id
        ? existingServices.find((currentService) => currentService.id === service.id)
        : existingServices[index]

      if (service.id && !existingService) {
        throw new ApiError(
          "SERVICE_NOT_FOUND",
          "Service was not found for this organization.",
          400,
          { serviceId: service.id },
        )
      }

      return {
        ...service,
        id: serviceId ?? newId("service"),
        createdAt: existingService?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }
    })
  }

  private withProviderNames(
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): SecurityProfileInput {
    return {
      ...input,
      services: input.services.map((service) => ({
        ...service,
        privacy: {
          ...service.privacy,
          analyticsProviders: this.providerNames(
            service.privacy.analyticsProviders,
            providerCatalog,
          ),
          advertisingProviders: this.providerNames(
            service.privacy.advertisingProviders,
            providerCatalog,
          ),
        },
      })),
      infrastructure: {
        ...input.infrastructure,
        organizationProviders: this.providerNames(
          input.infrastructure.organizationProviders,
          providerCatalog,
        ),
      },
      privacy: {
        ...input.privacy,
        organizationProviders: this.providerNames(
          input.privacy.organizationProviders,
          providerCatalog,
        ),
      },
    }
  }

  private providerNames(
    selectedProviders: OrganizationProvider[],
    providerCatalog: Provider[],
  ) {
    return selectedProviders.map((selectedProvider) => ({
      ...selectedProvider,
      name: this.catalogProvider(providerCatalog, selectedProvider).name,
    }))
  }

  private catalogProvider(
    providerCatalog: Provider[],
    selectedProvider: OrganizationProvider,
  ) {
    const provider = providerCatalog.find(
      (catalogProvider) =>
        catalogProvider.id === selectedProvider.providerId &&
        catalogProvider.systemTypes.includes(selectedProvider.systemType),
    )

    if (!provider) {
      throw new ApiError(
        "PROVIDER_NOT_AVAILABLE_FOR_SYSTEM",
        "Selected provider is not available for the requested system type.",
        400,
        {
          providerId: selectedProvider.providerId,
          systemType: selectedProvider.systemType,
        },
      )
    }

    return provider
  }
}
