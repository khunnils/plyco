import {
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared";

import { ApiError } from "./errors.js";

export type SecurityProfileInput = Pick<
  OrganizationSecurityProfile,
  "company" | "infrastructure" | "dataHandling" | "access"
>;

export interface SecurityProfileRepository {
  getSnapshot(): Promise<SecurityProgramSnapshot>;
  upsertProfile(
    input: SecurityProfileInput,
  ): Promise<OrganizationSecurityProfile>;
  listVendors(): Promise<Vendor[]>;
  createVendor(input: VendorInput): Promise<Vendor>;
  updateVendor(id: string, input: VendorInput): Promise<Vendor | null>;
  deleteVendor(id: string): Promise<boolean>;
}

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class InMemorySecurityProfileRepository implements SecurityProfileRepository {
  private organization: OrganizationSecurityProfile | null = null;
  private vendors = new Map<string, Vendor>();

  async getSnapshot(): Promise<SecurityProgramSnapshot> {
    return {
      organization: this.organization,
      vendors: Array.from(this.vendors.values()),
    };
  }

  async upsertProfile(
    input: SecurityProfileInput,
  ): Promise<OrganizationSecurityProfile> {
    const timestamp = now();
    const organization: OrganizationSecurityProfile = {
      id: this.organization?.id ?? newId("org"),
      ...input,
      createdAt: this.organization?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    this.organization = organization;
    return organization;
  }

  async listVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async createVendor(input: VendorInput): Promise<Vendor> {
    const timestamp = now();
    const dataProcessed = this.validVendorDataTypeNames(input);
    const vendor: Vendor = {
      id: newId("vendor"),
      ...input,
      dataProcessed,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  async updateVendor(id: string, input: VendorInput): Promise<Vendor | null> {
    const currentVendor = this.vendors.get(id);

    if (!currentVendor) {
      return null;
    }

    const dataProcessed = this.validVendorDataTypeNames(input);
    const vendor: Vendor = {
      id,
      ...input,
      dataProcessed,
      createdAt: currentVendor.createdAt,
      updatedAt: now(),
    };

    this.vendors.set(id, vendor);
    return vendor;
  }

  async deleteVendor(id: string): Promise<boolean> {
    return this.vendors.delete(id);
  }

  private validVendorDataTypeNames(input: VendorInput) {
    const requestedNames = Array.from(new Set(input.dataProcessed));

    if (requestedNames.length === 0) {
      return [];
    }

    const organizationDataTypeNames = new Set(
      this.organization?.dataHandling.dataTypesStored.map(
        (dataType) => dataType.name,
      ) ?? [],
    );
    const missingNames = requestedNames.filter(
      (name) => !organizationDataTypeNames.has(name),
    );

    if (missingNames.length > 0) {
      throw new ApiError(
        "VENDOR_DATA_TYPE_NOT_FOUND",
        "Vendor data processed must reference data types stored on the organization.",
        400,
        { dataProcessed: missingNames },
      );
    }

    return requestedNames;
  }
}
