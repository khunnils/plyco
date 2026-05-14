import {
  type OrganizationSecurityProfile,
  type Provider,
} from "@complyflow/shared"

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js"

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
    _providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now()
    const existing = this.organizations.get(organizationId)
    const organization: OrganizationSecurityProfile = {
      id: organizationId,
      ...input,
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
}
