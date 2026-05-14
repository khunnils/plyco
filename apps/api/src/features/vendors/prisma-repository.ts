import { mapVendorRecord, prisma, type PrismaClient } from "@complyflow/db"
import { type Vendor, type VendorInput } from "@complyflow/shared"

import { ApiError } from "../../errors.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type VendorRepository } from "./repository.js"

const VENDOR_INCLUDE = {
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
      where: { organizationId },
      include: VENDOR_INCLUDE,
      orderBy: { createdAt: "asc" },
    })

    return vendors.map(mapVendorRecord)
  }

  async createVendor(organizationId: string, input: VendorInput): Promise<Vendor> {
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendor = await this.client.organizationProvider.create({
      data: {
        organizationId,
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
      where: { id, organizationId },
    })

    if (!existing) {
      return null
    }

    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendor = await this.client.organizationProvider.update({
      where: { id },
      data: {
        ...this.vendorData(input),
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
      where: { id, organizationId },
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
      category: input.category,
      purpose: input.purpose,
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
