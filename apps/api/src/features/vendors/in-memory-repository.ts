import {
  businessActivitySchema,
  organizationProviderInventorySchema,
  serviceProviderUsageSchema,
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type OrganizationProviderInput,
} from "@plyco/shared";

import { ApiError } from "../../infrastructure/errors.js";
import { type OrganizationRepository } from "../organizations/repository.js";
import { type ProviderRepository } from "./repository.js";

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class InMemoryVendorRepository implements ProviderRepository {
  private activities = new Map<
    BusinessActivity["id"],
    BusinessActivity & { organizationId: string }
  >();
  private organizationProviders = new Map<
    string,
    OrganizationProvider & { organizationId: string }
  >();
  private serviceProviderUsage = new Map<
    string,
    ServiceProviderUsage & { organizationId: string }
  >();

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async listBusinessActivities(organizationId: string) {
    return Array.from(this.activities.values())
      .filter((activity) => activity.organizationId === organizationId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createBusinessActivity(
    organizationId: string,
    input: BusinessActivityInput,
  ) {
    const dataTypeIds = await this.validBusinessActivityDataTypeIds(
      organizationId,
      input,
    );
    const timestamp = now();
    const activity = businessActivitySchema.parse({
      id: newId("activity"),
      sortOrder: Array.from(this.activities.values()).filter(
        (activity) => activity.organizationId === organizationId,
      ).length,
      ...input,
      dataTypeIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as BusinessActivity & { organizationId: string };
    activity.organizationId = organizationId;
    this.activities.set(activity.id, activity);
    return activity;
  }

  async updateBusinessActivity(
    organizationId: string,
    id: string,
    input: BusinessActivityInput,
  ) {
    const current = this.activities.get(id);

    if (!current || current.organizationId !== organizationId) {
      return null;
    }

    const dataTypeIds = await this.validBusinessActivityDataTypeIds(
      organizationId,
      input,
    );
    const activity = { ...current, ...input, dataTypeIds, updatedAt: now() };
    this.activities.set(id, activity);
    return activity;
  }

  async deleteBusinessActivity(organizationId: string, id: string) {
    const current = this.activities.get(id);

    if (!current || current.organizationId !== organizationId) {
      return false;
    }

    return this.activities.delete(id);
  }

  async reorderBusinessActivities(organizationId: string, ids: string[]) {
    const activities = await this.listBusinessActivities(organizationId);
    const byId = new Map(activities.map((activity) => [activity.id, activity]));
    if (
      ids.length !== activities.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !byId.has(id))
    ) {
      throw new ApiError(
        "BUSINESS_ACTIVITY_ORDER_INVALID",
        "Order must contain every current activity exactly once.",
        400,
      );
    }
    ids.forEach((id, sortOrder) => {
      const activity = this.activities.get(id)!;
      this.activities.set(id, { ...activity, sortOrder });
    });
  }

  async listOrganizationProviders(organizationId: string) {
    return Array.from(this.organizationProviders.values()).filter(
      (provider) => provider.organizationId === organizationId,
    );
  }

  async createOrganizationProvider(
    organizationId: string,
    input: OrganizationProviderInput,
  ) {
    const duplicateProvider = Array.from(
      this.organizationProviders.values(),
    ).find(
      (provider) =>
        provider.organizationId === organizationId &&
        provider.name === input.name,
    );

    if (duplicateProvider) {
      const provider = organizationProviderInventorySchema.parse({
        ...duplicateProvider,
        providerId: duplicateProvider.providerId || input.providerId,
        systemTypes: Array.from(
          new Set([...duplicateProvider.systemTypes, ...input.systemTypes]),
        ),
        legalName: duplicateProvider.legalName || input.legalName,
        category: duplicateProvider.category || input.category,
        countryOfRegistration:
          duplicateProvider.countryOfRegistration ||
          input.countryOfRegistration,
        criticality: duplicateProvider.criticality || input.criticality,
        notes: duplicateProvider.notes || input.notes,
        purpose: duplicateProvider.purpose || input.purpose,
        updatedAt: now(),
      }) as OrganizationProvider & { organizationId: string };
      provider.organizationId = organizationId;
      this.organizationProviders.set(provider.id, provider);
      return provider;
    }

    const timestamp = now();
    const provider = organizationProviderInventorySchema.parse({
      id: newId("provider"),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as OrganizationProvider & { organizationId: string };
    provider.organizationId = organizationId;
    this.organizationProviders.set(provider.id, provider);
    return provider;
  }

  async updateOrganizationProvider(
    organizationId: string,
    id: string,
    input: OrganizationProviderInput,
  ) {
    const currentProvider = this.organizationProviders.get(id);

    if (!currentProvider || currentProvider.organizationId !== organizationId) {
      return null;
    }

    const provider = { ...currentProvider, ...input, updatedAt: now() };
    this.organizationProviders.set(id, provider);
    return provider;
  }

  async deleteOrganizationProvider(organizationId: string, id: string) {
    const currentProvider = this.organizationProviders.get(id);

    if (!currentProvider || currentProvider.organizationId !== organizationId) {
      return false;
    }

    return this.organizationProviders.delete(id);
  }

  async listServiceProviderUsage(organizationId: string) {
    return Array.from(this.serviceProviderUsage.values()).filter(
      (providerUsage) => providerUsage.organizationId === organizationId,
    );
  }

  async createServiceProviderUsage(
    organizationId: string,
    input: ServiceProviderUsageInput,
  ) {
    await this.validateServiceId(organizationId, input.serviceId);
    this.validateOrganizationProviderId(
      organizationId,
      input.organizationProviderId,
    );
    const timestamp = now();
    const dataProcessed = await this.validProviderDataTypeNames(
      organizationId,
      input,
    );
    const providerUsage = serviceProviderUsageSchema.parse({
      id: newId("provider_usage"),
      ...input,
      serviceName: await this.serviceName(organizationId, input.serviceId),
      providerName:
        this.organizationProviders.get(input.organizationProviderId)?.name ??
        "",
      dataProcessed,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as ServiceProviderUsage & { organizationId: string };
    providerUsage.organizationId = organizationId;
    this.serviceProviderUsage.set(providerUsage.id, providerUsage);
    return providerUsage;
  }

  async updateServiceProviderUsage(
    organizationId: string,
    id: string,
    input: ServiceProviderUsageInput,
  ) {
    const current = this.serviceProviderUsage.get(id);

    if (!current || current.organizationId !== organizationId) {
      return null;
    }

    await this.validateServiceId(organizationId, input.serviceId);
    this.validateOrganizationProviderId(
      organizationId,
      input.organizationProviderId,
    );
    const dataProcessed = await this.validProviderDataTypeNames(
      organizationId,
      input,
    );
    const providerUsage = serviceProviderUsageSchema.parse({
      id,
      ...input,
      serviceName: await this.serviceName(organizationId, input.serviceId),
      providerName:
        this.organizationProviders.get(input.organizationProviderId)?.name ??
        "",
      dataProcessed,
      createdAt: current.createdAt,
      updatedAt: now(),
    }) as ServiceProviderUsage & { organizationId: string };
    providerUsage.organizationId = organizationId;
    this.serviceProviderUsage.set(id, providerUsage);
    return providerUsage;
  }

  async deleteServiceProviderUsage(organizationId: string, id: string) {
    const current = this.serviceProviderUsage.get(id);

    if (!current || current.organizationId !== organizationId) {
      return false;
    }

    return this.serviceProviderUsage.delete(id);
  }

  private async validProviderDataTypeNames(
    organizationId: string,
    input: ServiceProviderUsageInput,
  ) {
    if (input.dataProcessingLevel === "none") {
      return [];
    }

    const requestedNames = Array.from(new Set(input.dataProcessed));

    if (requestedNames.length === 0) {
      return [];
    }

    const organizationDataTypeNames = new Set(
      await this.organizationRepository.listDataTypeNames(organizationId),
    );
    const missingNames = requestedNames.filter(
      (name) => !organizationDataTypeNames.has(name),
    );

    if (missingNames.length > 0) {
      throw new ApiError(
        "PROVIDER_DATA_TYPE_NOT_FOUND",
        "Provider data processed must reference data types stored on the organization.",
        400,
        { dataProcessed: missingNames },
      );
    }

    return requestedNames;
  }

  private async validBusinessActivityDataTypeIds(
    organizationId: string,
    input: BusinessActivityInput,
  ) {
    const requestedIds = Array.from(new Set(input.dataTypeIds));

    if (requestedIds.length === 0) {
      return [];
    }

    const organizationDataTypeIds = new Set(
      await this.organizationRepository.listDataTypeIds(organizationId),
    );
    const missingIds = requestedIds.filter(
      (id) => !organizationDataTypeIds.has(id),
    );

    if (missingIds.length > 0) {
      throw new ApiError(
        "DATA_TYPE_NOT_FOUND",
        "Activity data types must reference data types stored on the organization.",
        400,
        { dataTypeIds: missingIds },
      );
    }

    return requestedIds;
  }

  private async validateServiceId(organizationId: string, serviceId: string) {
    const serviceIds = new Set(
      await this.organizationRepository.listServiceIds(organizationId),
    );

    if (!serviceIds.has(serviceId)) {
      throw new ApiError(
        "PROVIDER_SERVICE_NOT_FOUND",
        "Provider usage must reference a service on the organization.",
        400,
        { serviceId },
      );
    }
  }

  private validateOrganizationProviderId(
    organizationId: string,
    organizationProviderId: string,
  ) {
    const provider = this.organizationProviders.get(organizationProviderId);

    if (!provider || provider.organizationId !== organizationId) {
      throw new ApiError(
        "SERVICE_PROVIDER_NOT_FOUND",
        "Service provider usage must reference a provider on the organization.",
        400,
        { organizationProviderId },
      );
    }
  }

  private async serviceName(organizationId: string, serviceId: string) {
    const organization =
      await this.organizationRepository.getOrganization(organizationId);
    return (
      organization?.services.find((service) => service.id === serviceId)
        ?.serviceName ?? ""
    );
  }
}
