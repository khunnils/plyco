import {
  mapBusinessActivityRecord,
  mapServiceProviderUsageRecord,
  mapOrganizationProviderRecord,
  prisma,
  type PrismaClient,
} from "@plyco/db"
import {
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type OrganizationProviderInput,
} from "@plyco/shared"

import { ApiError } from "../../errors.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type ProviderRepository } from "./repository.js"

const SERVICE_PROVIDER_USAGE_INCLUDE = {
  service: {
    select: { serviceName: true },
  },
  organizationProvider: {
    select: { name: true },
  },
  dataTypes: {
    include: { organizationDataType: true },
    orderBy: { createdAt: "asc" },
  },
} as const

export class PrismaVendorRepository implements ProviderRepository {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly client: PrismaClient = prisma,
  ) {}

  async listBusinessActivities(
    organizationId: string,
  ): Promise<BusinessActivity[]> {
    const activities = await this.client.businessActivity.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    })

    return activities.map(mapBusinessActivityRecord)
  }

  async createBusinessActivity(
    organizationId: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity> {
    const activity = await this.client.businessActivity.create({
      data: { organizationId, ...input },
    })

    return mapBusinessActivityRecord(activity)
  }

  async updateBusinessActivity(
    organizationId: string,
    id: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity | null> {
    const existing = await this.client.businessActivity.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    const activity = await this.client.businessActivity.update({
      where: { id },
      data: input,
    })

    return mapBusinessActivityRecord(activity)
  }

  async deleteBusinessActivity(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const existing = await this.client.businessActivity.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return false
    }

    await this.client.businessActivity.delete({ where: { id } })
    return true
  }

  async listOrganizationProviders(organizationId: string): Promise<OrganizationProvider[]> {
    const providers = await this.client.organizationProvider.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    })

    return providers.map(mapOrganizationProviderRecord)
  }

  async createOrganizationProvider(
    organizationId: string,
    input: OrganizationProviderInput,
  ): Promise<OrganizationProvider> {
    const provider = await this.client.organizationProvider.create({
      data: {
        organizationId,
        ...this.organizationProviderData(input),
      },
    })

    return mapOrganizationProviderRecord(provider)
  }

  async updateOrganizationProvider(
    organizationId: string,
    id: string,
    input: OrganizationProviderInput,
  ): Promise<OrganizationProvider | null> {
    const existing = await this.client.organizationProvider.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    const provider = await this.client.organizationProvider.update({
      where: { id },
      data: this.organizationProviderData(input),
    })

    return mapOrganizationProviderRecord(provider)
  }

  async deleteOrganizationProvider(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.client.organizationProvider.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return false
    }

    await this.client.organizationProvider.delete({ where: { id } })
    return true
  }

  async listServiceProviderUsage(
    organizationId: string,
  ): Promise<ServiceProviderUsage[]> {
    const providerUsage = await this.client.serviceProviderUsage.findMany({
      where: { organizationId },
      include: SERVICE_PROVIDER_USAGE_INCLUDE,
      orderBy: { createdAt: "asc" },
    })

    return providerUsage.map(mapServiceProviderUsageRecord)
  }

  async createServiceProviderUsage(
    organizationId: string,
    input: ServiceProviderUsageInput,
  ): Promise<ServiceProviderUsage> {
    await this.validateServiceId(organizationId, input.serviceId)
    await this.validateOrganizationProviderId(organizationId, input.organizationProviderId)
    const dataProcessed = await this.validProviderDataTypeNames(
      organizationId,
      input,
    )
    const providerUsage = await this.client.serviceProviderUsage.create({
      data: {
        organizationId,
        ...this.serviceProviderUsageData(input),
        dataTypes: {
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: SERVICE_PROVIDER_USAGE_INCLUDE,
    })

    return mapServiceProviderUsageRecord(providerUsage)
  }

  async updateServiceProviderUsage(
    organizationId: string,
    id: string,
    input: ServiceProviderUsageInput,
  ): Promise<ServiceProviderUsage | null> {
    const existing = await this.client.serviceProviderUsage.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    await this.validateServiceId(organizationId, input.serviceId)
    await this.validateOrganizationProviderId(organizationId, input.organizationProviderId)
    const dataProcessed = await this.validProviderDataTypeNames(
      organizationId,
      input,
    )
    const providerUsage = await this.client.serviceProviderUsage.update({
      where: { id },
      data: {
        ...this.serviceProviderUsageData(input),
        dataTypes: {
          deleteMany: {},
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: SERVICE_PROVIDER_USAGE_INCLUDE,
    })

    return mapServiceProviderUsageRecord(providerUsage)
  }

  async deleteServiceProviderUsage(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const existing = await this.client.serviceProviderUsage.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return false
    }

    await this.client.serviceProviderUsage.delete({ where: { id } })
    return true
  }

  private async validProviderDataTypeNames(
    organizationId: string,
    input: ServiceProviderUsageInput,
  ) {
    if (input.dataProcessingLevel === "none") {
      return []
    }

    const requestedNames = Array.from(new Set(input.dataProcessed))

    if (requestedNames.length === 0) {
      return []
    }

    const existingNames = new Set(
      await this.organizationRepository.listDataTypeNames(organizationId),
    )
    const missingNames = requestedNames.filter(
      (name) => !existingNames.has(name),
    )

    if (missingNames.length > 0) {
      throw new ApiError(
        "PROVIDER_DATA_TYPE_NOT_FOUND",
        "Provider data processed must reference data types stored on the organization.",
        400,
        { dataProcessed: missingNames },
      )
    }

    return requestedNames
  }

  private async validateServiceId(organizationId: string, serviceId: string) {
    const serviceIds = new Set(
      await this.organizationRepository.listServiceIds(organizationId),
    )

    if (!serviceIds.has(serviceId)) {
      throw new ApiError(
        "PROVIDER_SERVICE_NOT_FOUND",
        "Provider usage must reference a service on the organization.",
        400,
        { serviceId },
      )
    }
  }

  private async validateOrganizationProviderId(
    organizationId: string,
    organizationProviderId: string,
  ) {
    const providerIds = new Set(
      await this.organizationRepository.listOrganizationProviderIds(organizationId),
    )

    if (!providerIds.has(organizationProviderId)) {
      throw new ApiError(
        "SERVICE_PROVIDER_NOT_FOUND",
        "Service provider usage must reference a provider on the organization.",
        400,
        { organizationProviderId },
      )
    }
  }

  private connectDataType(organizationId: string, name: string) {
    return {
      connect: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
    }
  }

  private organizationProviderData(input: OrganizationProviderInput) {
    return {
      providerId: input.providerId || null,
      systemTypes: input.systemTypes,
      name: input.name,
      legalName: input.legalName,
      category: input.category,
      countryOfRegistration: input.countryOfRegistration,
      criticality: input.criticality,
      notes: input.notes || null,
      purpose: input.purpose || null,
    }
  }

  private serviceProviderUsageData(input: ServiceProviderUsageInput) {
    return {
      serviceId: input.serviceId,
      organizationProviderId: input.organizationProviderId,
      systemType: input.systemType,
      purpose: input.purpose,
      dataProcessingLevel: input.dataProcessingLevel,
      dpaStatus: input.dpaStatus,
      dataRegions: input.dataRegions,
      notes: input.notes || null,
    }
  }
}
