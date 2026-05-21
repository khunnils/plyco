import {
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
  type Vendor,
  type VendorInput,
} from "@plyco/shared"

export interface VendorRepository {
  listBusinessActivities(organizationId: string): Promise<BusinessActivity[]>
  createBusinessActivity(
    organizationId: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity>
  updateBusinessActivity(
    organizationId: string,
    id: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity | null>
  deleteBusinessActivity(organizationId: string, id: string): Promise<boolean>
  listVendors(organizationId: string): Promise<Vendor[]>
  createVendor(organizationId: string, input: VendorInput): Promise<Vendor>
  updateVendor(
    organizationId: string,
    id: string,
    input: VendorInput,
  ): Promise<Vendor | null>
  deleteVendor(organizationId: string, id: string): Promise<boolean>
  listServiceVendorUses(organizationId: string): Promise<ServiceVendorUse[]>
  createServiceVendorUse(
    organizationId: string,
    input: ServiceVendorUseInput,
  ): Promise<ServiceVendorUse>
  updateServiceVendorUse(
    organizationId: string,
    id: string,
    input: ServiceVendorUseInput,
  ): Promise<ServiceVendorUse | null>
  deleteServiceVendorUse(organizationId: string, id: string): Promise<boolean>
}
