import {
  type OrganizationProvider,
  type OrganizationSecurityProfile,
  type Provider,
} from "@plyco/shared"

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js"
import { ApiError } from "../../errors.js"

function now() {
  return new Date().toISOString()
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
    const organization: OrganizationSecurityProfile = {
      id: organizationId,
      ...this.withProviderNames(input, providerCatalog),
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

  private withProviderNames(
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): SecurityProfileInput {
    return {
      ...input,
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
