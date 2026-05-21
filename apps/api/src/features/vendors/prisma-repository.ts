import {
  mapBusinessActivityRecord,
  mapServiceVendorUseRecord,
  mapVendorRecord,
  prisma,
  type PrismaClient,
} from "@plyco/db"
import {
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
  type Vendor,
  type VendorInput,
} from "@plyco/shared"

import { ApiError } from "../../errors.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type VendorRepository } from "./repository.js"

const SERVICE_VENDOR_USE_INCLUDE = {
  service: {
    select: { serviceName: true },
  },
  vendor: {
    select: { name: true },
  },
  dataTypes: {
    include: { organizationDataType: true },
    orderBy: { createdAt: "asc" },
  },
} as const

export class PrismaVendorRepository implements VendorRepository {
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

  async listVendors(organizationId: string): Promise<Vendor[]> {
    const vendors = await this.client.vendorMaster.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    })

    return vendors.map(mapVendorRecord)
  }

  async createVendor(organizationId: string, input: VendorInput): Promise<Vendor> {
    const vendor = await this.client.vendorMaster.create({
      data: {
        organizationId,
        ...this.vendorData(input),
      },
    })

    return mapVendorRecord(vendor)
  }

  async updateVendor(
    organizationId: string,
    id: string,
    input: VendorInput,
  ): Promise<Vendor | null> {
    const existing = await this.client.vendorMaster.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    const vendor = await this.client.vendorMaster.update({
      where: { id },
      data: this.vendorData(input),
    })

    return mapVendorRecord(vendor)
  }

  async deleteVendor(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.client.vendorMaster.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return false
    }

    await this.client.vendorMaster.delete({ where: { id } })
    return true
  }

  async listServiceVendorUses(
    organizationId: string,
  ): Promise<ServiceVendorUse[]> {
    const vendorUses = await this.client.serviceVendorUse.findMany({
      where: { organizationId },
      include: SERVICE_VENDOR_USE_INCLUDE,
      orderBy: { createdAt: "asc" },
    })

    return vendorUses.map(mapServiceVendorUseRecord)
  }

  async createServiceVendorUse(
    organizationId: string,
    input: ServiceVendorUseInput,
  ): Promise<ServiceVendorUse> {
    await this.validateServiceId(organizationId, input.serviceId)
    await this.validateVendorId(organizationId, input.vendorId)
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendorUse = await this.client.serviceVendorUse.create({
      data: {
        organizationId,
        ...this.serviceVendorUseData(input),
        dataTypes: {
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: SERVICE_VENDOR_USE_INCLUDE,
    })

    return mapServiceVendorUseRecord(vendorUse)
  }

  async updateServiceVendorUse(
    organizationId: string,
    id: string,
    input: ServiceVendorUseInput,
  ): Promise<ServiceVendorUse | null> {
    const existing = await this.client.serviceVendorUse.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    await this.validateServiceId(organizationId, input.serviceId)
    await this.validateVendorId(organizationId, input.vendorId)
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendorUse = await this.client.serviceVendorUse.update({
      where: { id },
      data: {
        ...this.serviceVendorUseData(input),
        dataTypes: {
          deleteMany: {},
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: SERVICE_VENDOR_USE_INCLUDE,
    })

    return mapServiceVendorUseRecord(vendorUse)
  }

  async deleteServiceVendorUse(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const existing = await this.client.serviceVendorUse.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return false
    }

    await this.client.serviceVendorUse.delete({ where: { id } })
    return true
  }

  private async validVendorDataTypeNames(
    organizationId: string,
    input: ServiceVendorUseInput,
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
        "VENDOR_DATA_TYPE_NOT_FOUND",
        "Vendor data processed must reference data types stored on the organization.",
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
        "VENDOR_SERVICE_NOT_FOUND",
        "Vendor service must reference a service on the organization.",
        400,
        { serviceId },
      )
    }
  }

  private async validateVendorId(organizationId: string, vendorId: string) {
    const vendorIds = new Set(
      await this.organizationRepository.listVendorIds(organizationId),
    )

    if (!vendorIds.has(vendorId)) {
      throw new ApiError(
        "SERVICE_VENDOR_NOT_FOUND",
        "Service vendor use must reference a vendor on the organization.",
        400,
        { vendorId },
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

  private vendorData(input: VendorInput) {
    return {
      name: input.name,
      legalName: input.legalName,
      displayName: input.displayName,
      providerOrganizationName: input.providerOrganizationName,
      providerOrganizationLegalName: input.providerOrganizationLegalName,
      privacyPolicyUrl: input.privacyPolicyUrl,
      dpaUrl: input.dpaUrl,
      securityPageUrl: input.securityPageUrl,
      category: input.category,
      countryOfRegistration: input.countryOfRegistration,
      hasSubprocessors: input.hasSubprocessors,
      criticality: input.criticality,
      owner: input.owner || null,
      notes: input.notes || null,
    }
  }

  private serviceVendorUseData(input: ServiceVendorUseInput) {
    return {
      serviceId: input.serviceId,
      vendorId: input.vendorId,
      purpose: input.purpose,
      dataProcessingLevel: input.dataProcessingLevel,
      dpaStatus: input.dpaStatus,
      dataRegions: input.dataRegions,
      notes: input.notes || null,
    }
  }
}
