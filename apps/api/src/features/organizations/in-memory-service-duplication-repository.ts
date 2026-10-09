import {
  serviceProfileSchema,
  serviceProviderUsageSchema,
  type DuplicateServiceInput,
} from "@plyco/contracts";
import { ApiError } from "../../infrastructure/errors.js";
import { type InMemoryVendorRepository } from "../vendors/in-memory-repository.js";
import { type InMemoryOrganizationRepository } from "./in-memory-repository.js";
import { type ServiceDuplicationRepository } from "./service-duplication-repository.js";

export class InMemoryServiceDuplicationRepository implements ServiceDuplicationRepository {
  constructor(
    private readonly organizations: InMemoryOrganizationRepository,
    private readonly vendors: InMemoryVendorRepository,
  ) {}

  async duplicateService(
    organizationId: string,
    sourceServiceId: string,
    input: DuplicateServiceInput,
  ) {
    const organization =
      await this.organizations.getOrganization(organizationId);
    const usages = await this.vendors.listServiceProviderUsage(organizationId);
    const source = organization?.services.find(
      (service) => service.id === sourceServiceId,
    );
    if (!organization || !source) {
      throw new ApiError(
        "SERVICE_NOT_FOUND",
        "Service was not found for this organization.",
        404,
      );
    }
    const timestamp = new Date().toISOString();
    const service = serviceProfileSchema.parse({
      ...structuredClone(source),
      serviceName: input.serviceName,
      serviceUrl: input.serviceUrl,
      privacy: {
        ...structuredClone(source.privacy),
        primaryHostingRegion: input.primaryHostingRegion,
      },
      id: `service_${crypto.randomUUID()}`,
      sortOrder:
        Math.max(-1, ...organization.services.map((item) => item.sortOrder)) +
        1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const copiedUsages = usages
      .filter((usage) => usage.serviceId === sourceServiceId)
      .map((usage) =>
        serviceProviderUsageSchema.parse({
          ...structuredClone(usage),
          id: `provider_usage_${crypto.randomUUID()}`,
          serviceId: service.id,
          serviceName: service.serviceName,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      );
    // Publish only after all copies are prepared; no awaits separate these writes.
    this.vendors.insertPreparedServiceProviderUsage(
      organizationId,
      copiedUsages,
    );
    organization.services.push(service);
    return service.id;
  }
}
