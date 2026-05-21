import { mapVendorRecord, prisma, type PrismaClient } from "@plyco/db"
import { type Vendor, type VendorInput } from "@plyco/shared"

import { ApiError } from "../../errors.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type VendorRepository } from "./repository.js"

const VENDOR_INCLUDE = {
  service: {
    select: { serviceName: true },
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

  async listVendors(organizationId: string): Promise<Vendor[]> {
    const vendors = await this.client.organizationProvider.findMany({
      where: { organizationId, systemType: null },
      include: VENDOR_INCLUDE,
      orderBy: { createdAt: "asc" },
    })

    return vendors.map(mapVendorRecord)
  }

  async createVendor(organizationId: string, input: VendorInput): Promise<Vendor> {
    await this.validateServiceId(organizationId, input.serviceId)
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendor = await this.client.organizationProvider.create({
      data: {
        organizationId,
        serviceId: input.serviceId,
        ...this.vendorData(input),
        dataTypes: {
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: VENDOR_INCLUDE,
    })

    return mapVendorRecord(vendor)
  }

  async updateVendor(
    organizationId: string,
    id: string,
    input: VendorInput,
  ): Promise<Vendor | null> {
    const existing = await this.client.organizationProvider.findFirst({
      where: { id, organizationId, systemType: null },
    })

    if (!existing) {
      return null
    }

    await this.validateServiceId(organizationId, input.serviceId)
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendor = await this.client.organizationProvider.update({
      where: { id },
      data: {
        ...this.vendorData(input),
        serviceId: input.serviceId,
        dataTypes: {
          deleteMany: {},
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organizationId, name),
          })),
        },
      },
      include: VENDOR_INCLUDE,
    })

    return mapVendorRecord(vendor)
  }

  async deleteVendor(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.client.organizationProvider.findFirst({
      where: { id, organizationId, systemType: null },
    })

    if (!existing) {
      return false
    }

    await this.client.organizationProvider.delete({ where: { id } })
    return true
  }

  private async validVendorDataTypeNames(
    organizationId: string,
    input: VendorInput,
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
      purpose: input.purpose,
      countryOfRegistration: input.countryOfRegistration,
      hasSubprocessors: input.hasSubprocessors,
      dataProcessingLevel: input.dataProcessingLevel,
      dpaStatus: input.dpaStatus,
      dataRegions: input.dataRegions,
      criticality: input.criticality,
      owner: input.owner || null,
      notes: input.notes || null,
    }
  }
}
