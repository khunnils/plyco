import {
  type ProviderSelection,
  type OrganizationSecurityProfile,
  type Provider,
  type ServiceProfile,
  type ServiceProfileInput,
  type StoredDataType,
} from "@plyco/shared";

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js";
import { ApiError } from "../../infrastructure/errors.js";

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private organizations = new Map<string, OrganizationSecurityProfile>();

  async getOrganization(
    organizationId: string,
  ): Promise<OrganizationSecurityProfile | null> {
    return this.organizations.get(organizationId) ?? null;
  }

  async upsertProfile(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now();
    const existing = this.organizations.get(organizationId);
    const inputWithProviderNames = this.withProviderNames(
      input,
      providerCatalog,
    );
    const services = this.servicesWithIds(
      inputWithProviderNames.services,
      existing?.services ?? [],
      timestamp,
    );
    const dataTypesStored = this.dataTypesWithIds(
      inputWithProviderNames.dataHandling.dataTypesStored,
      existing?.dataHandling.dataTypesStored ?? [],
    );
    const organization: OrganizationSecurityProfile = {
      id: organizationId,
      ...inputWithProviderNames,
      dataHandling: {
        ...inputWithProviderNames.dataHandling,
        dataTypesStored,
      },
      services,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    this.organizations.set(organizationId, organization);
    return organization;
  }

  async listDataTypeNames(organizationId: string): Promise<string[]> {
    return (
      this.organizations
        .get(organizationId)
        ?.dataHandling.dataTypesStored.map((dataType) => dataType.name) ?? []
    );
  }

  async listDataTypeIds(organizationId: string): Promise<string[]> {
    return (
      this.organizations
        .get(organizationId)
        ?.dataHandling.dataTypesStored.flatMap((dataType) =>
          dataType.id ? [dataType.id] : [],
        ) ?? []
    );
  }

  async listServiceIds(organizationId: string): Promise<string[]> {
    return (
      this.organizations
        .get(organizationId)
        ?.services.map((service) => service.id) ?? []
    );
  }

  async listBusinessActivityIds(organizationId: string): Promise<string[]> {
    return Array.from(
      new Set(
        this.organizations
          .get(organizationId)
          ?.services.flatMap((service) => service.businessActivityIds) ?? [],
      ),
    );
  }

  async listOrganizationProviderIds(
    _organizationId: string,
  ): Promise<string[]> {
    return [];
  }

  async reorderServices(organizationId: string, ids: string[]): Promise<void> {
    const organization = this.organizations.get(organizationId);
    if (!organization)
      throw new ApiError(
        "ORGANIZATION_NOT_FOUND",
        "Organization was not found.",
        404,
      );
    organization.services = this.reorderExact(
      organization.services,
      ids,
      "SERVICE_ORDER_INVALID",
    );
  }

  async reorderDataTypes(organizationId: string, ids: string[]): Promise<void> {
    const organization = this.organizations.get(organizationId);
    if (!organization)
      throw new ApiError(
        "ORGANIZATION_NOT_FOUND",
        "Organization was not found.",
        404,
      );
    organization.dataHandling.dataTypesStored = this.reorderExact(
      organization.dataHandling.dataTypesStored,
      ids,
      "DATA_TYPE_ORDER_INVALID",
    );
  }

  private servicesWithIds(
    inputServices: ServiceProfileInput[],
    existingServices: ServiceProfile[],
    timestamp: string,
  ): ServiceProfile[] {
    return inputServices.map((service, index) => {
      const serviceId = service.id ?? existingServices[index]?.id;
      const existingService = service.id
        ? existingServices.find(
            (currentService) => currentService.id === service.id,
          )
        : existingServices[index];

      if (service.id && !existingService) {
        throw new ApiError(
          "SERVICE_NOT_FOUND",
          "Service was not found for this organization.",
          400,
          { serviceId: service.id },
        );
      }

      return {
        ...service,
        id: serviceId ?? newId("service"),
        sortOrder: index,
        createdAt: existingService?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
    });
  }

  private dataTypesWithIds(
    inputDataTypes: StoredDataType[],
    existingDataTypes: StoredDataType[],
  ): StoredDataType[] {
    return inputDataTypes.map((dataType, sortOrder) => ({
      ...dataType,
      sortOrder,
      id:
        dataType.id ??
        existingDataTypes.find((existing) => existing.name === dataType.name)
          ?.id ??
        newId("data_type"),
    }));
  }

  private reorderExact<T extends { id?: string; sortOrder: number }>(
    items: T[],
    ids: string[],
    errorCode: string,
  ): T[] {
    const byId = new Map(
      items.flatMap((item) => (item.id ? [[item.id, item] as const] : [])),
    );
    if (
      ids.length !== items.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !byId.has(id))
    ) {
      throw new ApiError(
        errorCode,
        "Order must contain every current item exactly once.",
        400,
      );
    }
    return ids.map((id, sortOrder) => ({ ...byId.get(id)!, sortOrder }));
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
    };
  }

  private providerNames(
    selectedProviders: ProviderSelection[],
    providerCatalog: Provider[],
  ) {
    return selectedProviders.map((selectedProvider) => ({
      ...selectedProvider,
      name:
        selectedProvider.providerId === "none"
          ? "None"
          : this.catalogProvider(providerCatalog, selectedProvider).name,
    }));
  }

  private catalogProvider(
    providerCatalog: Provider[],
    selectedProvider: ProviderSelection,
  ) {
    const provider = providerCatalog.find(
      (catalogProvider) =>
        catalogProvider.id === selectedProvider.providerId &&
        catalogProvider.systemTypes.includes(selectedProvider.systemType),
    );

    if (!provider) {
      throw new ApiError(
        "PROVIDER_NOT_AVAILABLE_FOR_SYSTEM",
        "Selected provider is not available for the requested system type.",
        400,
        {
          providerId: selectedProvider.providerId,
          systemType: selectedProvider.systemType,
        },
      );
    }

    return provider;
  }
}
