import {
  mapOrganizationRecord,
  mapVendorRecord,
  prisma,
  type PrismaClient,
} from "@complyflow/db"
import {
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import type {
  SecurityProfileInput,
  SecurityProfileRepository,
} from "./repository.js"

const SINGLE_ORG_FILTER = {}

export class PrismaSecurityProfileRepository
  implements SecurityProfileRepository
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async getSnapshot(): Promise<SecurityProgramSnapshot> {
    const organization = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
    })
    const vendors = organization
      ? await this.client.vendor.findMany({
          where: { organizationId: organization.id },
          orderBy: { createdAt: "asc" },
        })
      : []

    return {
      organization: organization ? mapOrganizationRecord(organization) : null,
      vendors: vendors.map(mapVendorRecord),
    }
  }

  async upsertProfile(
    input: SecurityProfileInput
  ): Promise<OrganizationSecurityProfile> {
    const existing = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
    })
    const data = {
      company: input.company,
      infrastructure: input.infrastructure,
      dataHandling: input.dataHandling,
      access: input.access,
    }

    const organization = existing
      ? await this.client.organization.update({
          where: { id: existing.id },
          data,
        })
      : await this.client.organization.create({ data })

    return mapOrganizationRecord(organization)
  }

  async listVendors(): Promise<Vendor[]> {
    const organization = await this.getOrCreateOrganization()
    const vendors = await this.client.vendor.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "asc" },
    })

    return vendors.map(mapVendorRecord)
  }

  async createVendor(input: VendorInput): Promise<Vendor> {
    const organization = await this.getOrCreateOrganization()
    const vendor = await this.client.vendor.create({
      data: {
        organizationId: organization.id,
        ...this.vendorData(input),
      },
    })

    return mapVendorRecord(vendor)
  }

  async updateVendor(id: string, input: VendorInput): Promise<Vendor | null> {
    const organization = await this.getOrCreateOrganization()
    const existing = await this.client.vendor.findFirst({
      where: { id, organizationId: organization.id },
    })

    if (!existing) {
      return null
    }

    const vendor = await this.client.vendor.update({
      where: { id },
      data: this.vendorData(input),
    })

    return mapVendorRecord(vendor)
  }

  async deleteVendor(id: string): Promise<boolean> {
    const organization = await this.getOrCreateOrganization()
    const existing = await this.client.vendor.findFirst({
      where: { id, organizationId: organization.id },
    })

    if (!existing) {
      return false
    }

    await this.client.vendor.delete({ where: { id } })
    return true
  }

  private async getOrCreateOrganization() {
    const existing = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
    })

    if (existing) {
      return existing
    }

    return this.client.organization.create({
      data: {
        company: {
          companyName: "Untitled company",
          employeeCount: 1,
          industries: [],
          regions: [],
          handlesPii: false,
          handlesSensitiveData: false,
          complianceGoals: [],
        },
        infrastructure: {
          cloudProviders: [],
          sourceControlProvider: "",
          authProvider: "",
          passwordManager: "",
          mfaEnabled: false,
          encryptedDevicesRequired: false,
          backupsEnabled: false,
          centralizedLoggingEnabled: false,
        },
        dataHandling: {
          dataTypesStored: [],
          storesPii: false,
          storesHealthcareData: false,
          encryptionAtRest: false,
          encryptionInTransit: false,
          productionDataInDevelopment: false,
          retentionPolicyExists: false,
        },
        access: {
          mfaRequired: false,
          ssoEnabled: false,
          sharedAccountsExist: false,
          offboardingProcessExists: false,
          accessReviewsPerformed: false,
          privilegedAccessRestricted: false,
        },
      },
    })
  }

  private vendorData(input: VendorInput) {
    return {
      name: input.name,
      category: input.category,
      purpose: input.purpose,
      hasSubprocessors: input.hasSubprocessors,
      dataProcessed: input.dataProcessed,
      dpaStatus: input.dpaStatus,
      dataRegions: input.dataRegions,
      criticality: input.criticality,
      owner: input.owner || null,
      notes: input.notes || null,
    }
  }
}
