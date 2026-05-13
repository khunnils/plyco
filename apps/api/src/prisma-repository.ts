import {
  mapOrganizationRecord,
  mapVendorRecord,
  prisma,
  type PrismaClient,
} from "@complyflow/db";
import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared";

import type {
  SecurityProfileInput,
  SecurityProfileRepository,
} from "./repository.js";
import { ApiError } from "./errors.js";

const SINGLE_ORG_FILTER = {};
const ORGANIZATION_INCLUDE = {
  accessProfile: true,
  dataHandlingProfile: true,
  dataTypes: { orderBy: { createdAt: "asc" } },
  infrastructureProfile: true,
} as const;
const VENDOR_INCLUDE = {
  dataTypes: {
    include: { organizationDataType: true },
    orderBy: { createdAt: "asc" },
  },
} as const;

export class PrismaSecurityProfileRepository implements SecurityProfileRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getSnapshot(): Promise<SecurityProgramSnapshot> {
    const organization = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
      include: ORGANIZATION_INCLUDE,
    });
    const vendors = organization
      ? await this.client.vendor.findMany({
          where: { organizationId: organization.id },
          include: VENDOR_INCLUDE,
          orderBy: { createdAt: "asc" },
        })
      : [];

    return {
      organization: organization ? mapOrganizationRecord(organization) : null,
      vendors: vendors.map(mapVendorRecord),
    };
  }

  async upsertProfile(
    input: SecurityProfileInput,
  ): Promise<OrganizationSecurityProfile> {
    const existing = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
    });
    const organizationData = this.organizationData(input.company);
    const infrastructureData = this.infrastructureData(input.infrastructure);
    const dataHandlingData = this.dataHandlingData(input.dataHandling);
    const accessData = this.accessData(input.access);

    const organization = existing
      ? await this.client.organization.update({
          where: { id: existing.id },
          data: {
            ...organizationData,
            accessProfile: {
              upsert: {
                create: accessData,
                update: accessData,
              },
            },
            dataHandlingProfile: {
              upsert: {
                create: dataHandlingData,
                update: dataHandlingData,
              },
            },
            infrastructureProfile: {
              upsert: {
                create: infrastructureData,
                update: infrastructureData,
              },
            },
          },
          include: ORGANIZATION_INCLUDE,
        })
      : await this.client.organization.create({
          data: {
            ...organizationData,
            accessProfile: { create: accessData },
            dataHandlingProfile: { create: dataHandlingData },
            dataTypes: {
              create: this.organizationDataTypes(input.dataHandling),
            },
            infrastructureProfile: { create: infrastructureData },
          },
          include: ORGANIZATION_INCLUDE,
        });

    if (existing) {
      await this.syncOrganizationDataTypes(organization.id, input.dataHandling);

      return mapOrganizationRecord(
        await this.client.organization.findUniqueOrThrow({
          where: { id: organization.id },
          include: ORGANIZATION_INCLUDE,
        }),
      );
    }

    return mapOrganizationRecord(organization);
  }

  async listVendors(): Promise<Vendor[]> {
    const organization = await this.getOrCreateOrganization();
    const vendors = await this.client.vendor.findMany({
      where: { organizationId: organization.id },
      include: VENDOR_INCLUDE,
      orderBy: { createdAt: "asc" },
    });

    return vendors.map(mapVendorRecord);
  }

  async createVendor(input: VendorInput): Promise<Vendor> {
    const organization = await this.getOrCreateOrganization();
    const dataProcessed = await this.validVendorDataTypeNames(
      organization.id,
      input,
    );
    const vendor = await this.client.vendor.create({
      data: {
        organizationId: organization.id,
        ...this.vendorData(input),
        dataTypes: {
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organization.id, name),
          })),
        },
      },
      include: VENDOR_INCLUDE,
    });

    return mapVendorRecord(vendor);
  }

  async updateVendor(id: string, input: VendorInput): Promise<Vendor | null> {
    const organization = await this.getOrCreateOrganization();
    const existing = await this.client.vendor.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!existing) {
      return null;
    }

    const dataProcessed = await this.validVendorDataTypeNames(
      organization.id,
      input,
    );
    const vendor = await this.client.vendor.update({
      where: { id },
      data: {
        ...this.vendorData(input),
        dataTypes: {
          deleteMany: {},
          create: dataProcessed.map((name) => ({
            organizationDataType: this.connectDataType(organization.id, name),
          })),
        },
      },
      include: VENDOR_INCLUDE,
    });

    return mapVendorRecord(vendor);
  }

  async deleteVendor(id: string): Promise<boolean> {
    const organization = await this.getOrCreateOrganization();
    const existing = await this.client.vendor.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!existing) {
      return false;
    }

    await this.client.vendor.delete({ where: { id } });
    return true;
  }

  private async getOrCreateOrganization() {
    const existing = await this.client.organization.findFirst({
      where: SINGLE_ORG_FILTER,
    });

    if (!existing) {
      return this.client.organization.create({
        data: {
          ...this.organizationData({
            ...emptyCompanyProfile,
            companyName: "Untitled company",
          }),
          accessProfile: { create: this.accessData(emptyAccessProfile) },
          dataHandlingProfile: {
            create: this.dataHandlingData(emptyDataHandlingProfile),
          },
          dataTypes: {
            create: this.organizationDataTypes(emptyDataHandlingProfile),
          },
          infrastructureProfile: {
            create: this.infrastructureData(emptyInfrastructureProfile),
          },
        },
        include: ORGANIZATION_INCLUDE,
      });
    }

    return this.client.organization.update({
      where: { id: existing.id },
      data: {
        accessProfile: {
          upsert: {
            create: this.accessData(emptyAccessProfile),
            update: {},
          },
        },
        dataHandlingProfile: {
          upsert: {
            create: this.dataHandlingData(emptyDataHandlingProfile),
            update: {},
          },
        },
        infrastructureProfile: {
          upsert: {
            create: this.infrastructureData(emptyInfrastructureProfile),
            update: {},
          },
        },
      },
      include: ORGANIZATION_INCLUDE,
    });
  }

  private organizationData(input: CompanyProfile) {
    return {
      companyName: input.companyName,
      employeeCount: input.employeeCount,
      industries: input.industries,
      regions: input.regions,
      handlesPii: input.handlesPii,
      handlesSensitiveData: input.handlesSensitiveData,
      complianceGoals: input.complianceGoals,
    };
  }

  private infrastructureData(input: InfrastructureProfile) {
    return {
      cloudProviders: input.cloudProviders,
      sourceControlProvider: input.sourceControlProvider || null,
      authProvider: input.authProvider || null,
      passwordManager: input.passwordManager || null,
      mfaEnabled: input.mfaEnabled,
      encryptedDevicesRequired: input.encryptedDevicesRequired,
      backupsEnabled: input.backupsEnabled,
      centralizedLoggingEnabled: input.centralizedLoggingEnabled,
    };
  }

  private dataHandlingData(input: DataHandlingProfile) {
    return {
      storesPii: input.storesPii,
      storesHealthcareData: input.storesHealthcareData,
      encryptionAtRest: input.encryptionAtRest,
      encryptionInTransit: input.encryptionInTransit,
      productionDataInDevelopment: input.productionDataInDevelopment,
      retentionPolicyExists: input.retentionPolicyExists,
    };
  }

  private organizationDataTypes(input: DataHandlingProfile) {
    return input.dataTypesStored.map((dataType) => ({
      name: dataType.name,
      isSensitive: dataType.isSensitive,
      description: dataType.description,
    }));
  }

  private async syncOrganizationDataTypes(
    organizationId: string,
    input: DataHandlingProfile,
  ) {
    const dataTypes = this.organizationDataTypes(input);
    const names = dataTypes.map((dataType) => dataType.name);

    await this.client.organizationDataType.deleteMany({
      where: {
        organizationId,
        name: { notIn: names },
      },
    });

    await Promise.all(
      dataTypes.map((dataType) =>
        this.client.organizationDataType.upsert({
          where: {
            organizationId_name: {
              organizationId,
              name: dataType.name,
            },
          },
          create: {
            organizationId,
            ...dataType,
          },
          update: {
            isSensitive: dataType.isSensitive,
            description: dataType.description,
          },
        }),
      ),
    );
  }

  private async validVendorDataTypeNames(
    organizationId: string,
    input: VendorInput,
  ) {
    const requestedNames = Array.from(new Set(input.dataProcessed));

    if (requestedNames.length === 0) {
      return [];
    }

    const existingDataTypes = await this.client.organizationDataType.findMany({
      where: {
        organizationId,
        name: { in: requestedNames },
      },
      select: { name: true },
    });
    const existingNames = new Set(
      existingDataTypes.map((dataType) => dataType.name),
    );
    const missingNames = requestedNames.filter(
      (name) => !existingNames.has(name),
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

  private connectDataType(organizationId: string, name: string) {
    return {
      connect: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
    };
  }

  private accessData(input: AccessProfile) {
    return {
      mfaRequired: input.mfaRequired,
      ssoEnabled: input.ssoEnabled,
      sharedAccountsExist: input.sharedAccountsExist,
      offboardingProcessExists: input.offboardingProcessExists,
      accessReviewsPerformed: input.accessReviewsPerformed,
      privilegedAccessRestricted: input.privilegedAccessRestricted,
    };
  }

  private vendorData(input: VendorInput) {
    return {
      name: input.name,
      category: input.category,
      purpose: input.purpose,
      hasSubprocessors: input.hasSubprocessors,
      dpaStatus: input.dpaStatus,
      dataRegions: input.dataRegions,
      criticality: input.criticality,
      owner: input.owner || null,
      notes: input.notes || null,
    };
  }
}
