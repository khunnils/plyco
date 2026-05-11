import {
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

export type SecurityProfileInput = Pick<
  OrganizationSecurityProfile,
  "company" | "infrastructure" | "dataHandling" | "access"
>

export interface SecurityProfileRepository {
  getSnapshot(): Promise<SecurityProgramSnapshot>
  upsertProfile(input: SecurityProfileInput): Promise<OrganizationSecurityProfile>
  listVendors(): Promise<Vendor[]>
  createVendor(input: VendorInput): Promise<Vendor>
  updateVendor(id: string, input: VendorInput): Promise<Vendor | null>
  deleteVendor(id: string): Promise<boolean>
}

function now() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export class InMemorySecurityProfileRepository
  implements SecurityProfileRepository
{
  private organization: OrganizationSecurityProfile | null = null
  private vendors = new Map<string, Vendor>()

  async getSnapshot(): Promise<SecurityProgramSnapshot> {
    return {
      organization: this.organization,
      vendors: Array.from(this.vendors.values()),
    }
  }

  async upsertProfile(
    input: SecurityProfileInput
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now()
    const organization: OrganizationSecurityProfile = {
      id: this.organization?.id ?? newId("org"),
      ...input,
      createdAt: this.organization?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    this.organization = organization
    return organization
  }

  async listVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values())
  }

  async createVendor(input: VendorInput): Promise<Vendor> {
    const timestamp = now()
    const vendor: Vendor = {
      id: newId("vendor"),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.vendors.set(vendor.id, vendor)
    return vendor
  }

  async updateVendor(id: string, input: VendorInput): Promise<Vendor | null> {
    const currentVendor = this.vendors.get(id)

    if (!currentVendor) {
      return null
    }

    const vendor: Vendor = {
      id,
      ...input,
      createdAt: currentVendor.createdAt,
      updatedAt: now(),
    }

    this.vendors.set(id, vendor)
    return vendor
  }

  async deleteVendor(id: string): Promise<boolean> {
    return this.vendors.delete(id)
  }
}
