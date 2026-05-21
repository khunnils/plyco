import {
  businessActivitySchema,
  serviceVendorUseSchema,
  vendorSchema,
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

function now() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export class InMemoryVendorRepository implements VendorRepository {
  private activities = new Map<BusinessActivity["id"], BusinessActivity & { organizationId: string }>()
  private vendors = new Map<string, Vendor & { organizationId: string }>()
  private serviceVendorUses = new Map<
    string,
    ServiceVendorUse & { organizationId: string }
  >()

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async listBusinessActivities(organizationId: string) {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.organizationId === organizationId,
    )
  }

  async createBusinessActivity(
    organizationId: string,
    input: BusinessActivityInput,
  ) {
    const timestamp = now()
    const activity = businessActivitySchema.parse({
      id: newId("activity"),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as BusinessActivity & { organizationId: string }
    activity.organizationId = organizationId
    this.activities.set(activity.id, activity)
    return activity
  }

  async updateBusinessActivity(
    organizationId: string,
    id: string,
    input: BusinessActivityInput,
  ) {
    const current = this.activities.get(id)

    if (!current || current.organizationId !== organizationId) {
      return null
    }

    const activity = {
      ...current,
      ...input,
      updatedAt: now(),
    }
    this.activities.set(id, activity)
    return activity
  }

  async deleteBusinessActivity(organizationId: string, id: string) {
    const current = this.activities.get(id)

    if (!current || current.organizationId !== organizationId) {
      return false
    }

    return this.activities.delete(id)
  }

  async listVendors(organizationId: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter(
      (vendor) => vendor.organizationId === organizationId,
    )
  }

  async createVendor(organizationId: string, input: VendorInput): Promise<Vendor> {
    const timestamp = now()
    const vendor = vendorSchema.parse({
      id: newId("vendor"),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as Vendor & { organizationId: string }
    vendor.organizationId = organizationId
    this.vendors.set(vendor.id, vendor)
    return vendor
  }

  async updateVendor(
    organizationId: string,
    id: string,
    input: VendorInput,
  ): Promise<Vendor | null> {
    const currentVendor = this.vendors.get(id)

    if (!currentVendor || currentVendor.organizationId !== organizationId) {
      return null
    }

    const vendor = {
      ...currentVendor,
      ...input,
      updatedAt: now(),
    }
    this.vendors.set(id, vendor)
    return vendor
  }

  async deleteVendor(organizationId: string, id: string): Promise<boolean> {
    const currentVendor = this.vendors.get(id)

    if (!currentVendor || currentVendor.organizationId !== organizationId) {
      return false
    }

    return this.vendors.delete(id)
  }

  async listServiceVendorUses(
    organizationId: string,
  ): Promise<ServiceVendorUse[]> {
    return Array.from(this.serviceVendorUses.values()).filter(
      (vendorUse) => vendorUse.organizationId === organizationId,
    )
  }

  async createServiceVendorUse(
    organizationId: string,
    input: ServiceVendorUseInput,
  ) {
    await this.validateServiceId(organizationId, input.serviceId)
    this.validateVendorId(organizationId, input.vendorId)
    const timestamp = now()
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendorUse = serviceVendorUseSchema.parse({
      id: newId("vendor_use"),
      ...input,
      serviceName: await this.serviceName(organizationId, input.serviceId),
      vendorName: this.vendors.get(input.vendorId)?.name ?? "",
      dataProcessed,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as ServiceVendorUse & { organizationId: string }
    vendorUse.organizationId = organizationId
    this.serviceVendorUses.set(vendorUse.id, vendorUse)
    return vendorUse
  }

  async updateServiceVendorUse(
    organizationId: string,
    id: string,
    input: ServiceVendorUseInput,
  ) {
    const current = this.serviceVendorUses.get(id)

    if (!current || current.organizationId !== organizationId) {
      return null
    }

    await this.validateServiceId(organizationId, input.serviceId)
    this.validateVendorId(organizationId, input.vendorId)
    const dataProcessed = await this.validVendorDataTypeNames(
      organizationId,
      input,
    )
    const vendorUse = serviceVendorUseSchema.parse({
      id,
      ...input,
      serviceName: await this.serviceName(organizationId, input.serviceId),
      vendorName: this.vendors.get(input.vendorId)?.name ?? "",
      dataProcessed,
      createdAt: current.createdAt,
      updatedAt: now(),
    }) as ServiceVendorUse & { organizationId: string }
    vendorUse.organizationId = organizationId
    this.serviceVendorUses.set(id, vendorUse)
    return vendorUse
  }

  async deleteServiceVendorUse(organizationId: string, id: string) {
    const current = this.serviceVendorUses.get(id)

    if (!current || current.organizationId !== organizationId) {
      return false
    }

    return this.serviceVendorUses.delete(id)
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

    const organizationDataTypeNames = new Set(
      await this.organizationRepository.listDataTypeNames(organizationId),
    )
    const missingNames = requestedNames.filter(
      (name) => !organizationDataTypeNames.has(name),
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

  private validateVendorId(organizationId: string, vendorId: string) {
    const vendor = this.vendors.get(vendorId)

    if (!vendor || vendor.organizationId !== organizationId) {
      throw new ApiError(
        "SERVICE_VENDOR_NOT_FOUND",
        "Service vendor use must reference a vendor on the organization.",
        400,
        { vendorId },
      )
    }
  }

  private async serviceName(organizationId: string, serviceId: string) {
    const organization = await this.organizationRepository.getOrganization(organizationId)
    return (
      organization?.services.find((service) => service.id === serviceId)
        ?.serviceName ?? ""
    )
  }
}
