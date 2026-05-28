import {
  mapOrganizationRecord,
  Prisma,
  prisma,
  type PrismaClient,
} from "@plyco/db";
import {
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type ProviderSelection,
  type OrganizationSecurityProfile,
  type PrivacyProfile,
  type Provider,
  type ProviderSystemType,
  type ServiceProfileInput,
} from "@plyco/shared";

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js";
import { ApiError } from "../../infrastructure/errors.js";

const jsonValue = (value: string[] | null) =>
  value === null ? Prisma.DbNull : value;

export const ORGANIZATION_INCLUDE = {
  accessProfile: true,
  dataHandlingProfile: true,
  dataTypes: { orderBy: { createdAt: "asc" } },
  infrastructureProfile: true,
  privacyProfile: true,
  services: {
    include: { businessActivities: true },
    orderBy: { createdAt: "asc" },
  },
  organizationProviders: {
    select: {
      name: true,
      providerId: true,
      systemTypes: true,
    },
  },
} as const;

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getOrganization(
    organizationId: string,
  ): Promise<OrganizationSecurityProfile | null> {
    const organization = await this.client.organization.findUnique({
      where: { id: organizationId },
      include: ORGANIZATION_INCLUDE,
    });

    return organization ? mapOrganizationRecord(organization) : null;
  }

  async upsertProfile(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile> {
    const organizationData = this.organizationData(input.company);
    const infrastructureData = this.infrastructureData(input.infrastructure);
    const dataHandlingData = this.dataHandlingData(input.dataHandling);
    const privacyData = this.privacyData(input.privacy);
    const accessData = this.accessData(input.access);

    const organization = await this.client.organization.update({
      where: { id: organizationId },
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
        privacyProfile: {
          upsert: {
            create: privacyData,
            update: privacyData,
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
    });

    await this.syncOrganizationDataTypes(organization.id, input.dataHandling);
    const services = await this.syncServices(organization.id, input.services);
    await this.syncOrganizationProviders(
      organization.id,
      { ...input, services },
      providerCatalog,
    );

    return mapOrganizationRecord(
      await this.client.organization.findUniqueOrThrow({
        where: { id: organization.id },
        include: ORGANIZATION_INCLUDE,
      }),
    );
  }

  async listDataTypeNames(organizationId: string): Promise<string[]> {
    const dataTypes = await this.client.organizationDataType.findMany({
      where: { organizationId },
      select: { name: true },
    });

    return dataTypes.map((dataType) => dataType.name);
  }

  async listServiceIds(organizationId: string): Promise<string[]> {
    const services = await this.client.serviceProfile.findMany({
      where: { organizationId },
      select: { id: true },
    });

    return services.map((service) => service.id);
  }

  async listBusinessActivityIds(organizationId: string): Promise<string[]> {
    const activities = await this.client.businessActivity.findMany({
      where: { organizationId },
      select: { id: true },
    });

    return activities.map((activity) => activity.id);
  }

  async listOrganizationProviderIds(organizationId: string): Promise<string[]> {
    const providers = await this.client.organizationProvider.findMany({
      where: { organizationId },
      select: { id: true },
    });

    return providers.map((provider) => provider.id);
  }

  private organizationData(input: CompanyProfile) {
    return {
      companyName: input.companyName,
      legalEntityName: input.legalEntityName,
      website: input.website,
      contactEmail: input.contactEmail,
      securityContactEmail: input.securityContactEmail,
      privacyContactEmail: input.privacyContactEmail,
      country: input.country,
      address: input.address,
      employeeCount: input.employeeCount,
      industries: jsonValue(input.industries),
      regions: jsonValue(input.regions),
      handlesPii: input.handlesPii,
      handlesSensitiveData: input.handlesSensitiveData,
      complianceGoals: jsonValue(input.complianceGoals),
    };
  }

  private infrastructureData(input: InfrastructureProfile) {
    return {
      mfaEnabled: input.mfaEnabled,
      encryptedDevicesRequired: input.encryptedDevicesRequired,
      backupsEnabled: input.backupsEnabled,
      centralizedLoggingEnabled: input.centralizedLoggingEnabled,
      atRestAlgorithm: input.atRestAlgorithm,
      inTransitMinimumTlsVersion: input.inTransitMinimumTlsVersion,
      keyManagementProvider: input.keyManagementProvider,
      logRetentionDays: input.logRetentionDays,
      logRetentionDaysStatus: input.logRetentionDaysStatus,
      securityMonitoringOwner: input.securityMonitoringOwner,
      scanningCadence: input.scanningCadence,
      patchingSlaCriticalDays: input.patchingSlaCriticalDays,
      patchingSlaCriticalDaysStatus: input.patchingSlaCriticalDaysStatus,
      patchingSlaHighDays: input.patchingSlaHighDays,
      patchingSlaHighDaysStatus: input.patchingSlaHighDaysStatus,
      incidentResponsePlanExists: input.incidentResponsePlanExists,
      incidentNotificationTimeline: input.incidentNotificationTimeline,
      customerNotificationProcess: input.customerNotificationProcess,
      incidentResponseLastTestedDate: input.incidentResponseLastTestedDate,
      backupCadence: input.backupCadence,
      backupRetentionDays: input.backupRetentionDays,
      backupRetentionDaysStatus: input.backupRetentionDaysStatus,
      restoreTestingCadence: input.restoreTestingCadence,
      vendorReviewRequired: input.vendorReviewRequired,
      vendorReviewCadence: input.vendorReviewCadence,
      dpaRequiredForProcessors: input.dpaRequiredForProcessors,
    };
  }

  private serviceData(input: ServiceProfileInput) {
    return {
      serviceName: input.serviceName,
      serviceDescription: input.serviceDescription,
      serviceUrl: input.serviceUrl,
      userTypes: jsonValue(input.userTypes),
      customerTypes: jsonValue(input.customerTypes),
      availabilityRegions: jsonValue(input.availabilityRegions),
      childrenDirected: input.childrenDirected,
      minimumUserAge: input.minimumUserAge,
      usesCookiesOrTrackingTechnologies:
        input.privacy.usesCookiesOrTrackingTechnologies,
      cookieTrackingCategories: jsonValue(
        input.privacy.cookieTrackingCategories,
      ),
      cookieConsentMechanism: input.privacy.cookieConsentMechanism,
      doNotTrackResponse: input.privacy.doNotTrackResponse,
      globalPrivacyControlSupported:
        input.privacy.globalPrivacyControlSupported,
      primaryHostingRegion: input.privacy.primaryHostingRegion,
    };
  }

  private async syncServices(
    organizationId: string,
    services: ServiceProfileInput[],
  ): Promise<ServiceProfileInput[]> {
    const existingServices = await this.client.serviceProfile.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const existingBusinessActivityIds = new Set(
      await this.listBusinessActivityIds(organizationId),
    );
    const existingIds = new Set(existingServices.map((service) => service.id));
    const resolvedServices = services.map((service, index) => ({
      ...service,
      id: service.id ?? existingServices[index]?.id,
    }));
    const requestedIds = resolvedServices.flatMap((service) =>
      service.id ? [service.id] : [],
    );
    const unknownId = requestedIds.find((id) => !existingIds.has(id));

    if (unknownId) {
      throw new ApiError(
        "SERVICE_NOT_FOUND",
        "Service was not found for this organization.",
        400,
        { serviceId: unknownId },
      );
    }

    const requestedActivityIds = Array.from(
      new Set(
        resolvedServices.flatMap((service) => service.businessActivityIds),
      ),
    );
    const unknownActivityId = requestedActivityIds.find(
      (id) => !existingBusinessActivityIds.has(id),
    );

    if (unknownActivityId) {
      throw new ApiError(
        "BUSINESS_ACTIVITY_NOT_FOUND",
        "Service activity must reference a business activity on the organization.",
        400,
        { businessActivityId: unknownActivityId },
      );
    }

    await this.client.serviceProfile.deleteMany({
      where: {
        organizationId,
        ...(requestedIds.length > 0 ? { id: { notIn: requestedIds } } : {}),
      },
    });

    return Promise.all(
      resolvedServices.map(async (service) => {
        const record = service.id
          ? await this.client.serviceProfile.update({
              where: { id: service.id },
              data: this.serviceData(service),
            })
          : await this.client.serviceProfile.create({
              data: {
                organizationId,
                ...this.serviceData(service),
              },
            });

        await this.syncServiceBusinessActivities(
          record.id,
          service.businessActivityIds,
        );

        return { ...service, id: record.id };
      }),
    );
  }

  private async syncServiceBusinessActivities(
    serviceId: string,
    businessActivityIds: string[],
  ) {
    const requestedIds = Array.from(new Set(businessActivityIds));

    await this.client.serviceBusinessActivity.deleteMany({
      where: {
        serviceId,
        ...(requestedIds.length > 0
          ? { businessActivityId: { notIn: requestedIds } }
          : {}),
      },
    });

    await Promise.all(
      requestedIds.map((businessActivityId) =>
        this.client.serviceBusinessActivity.upsert({
          where: {
            serviceId_businessActivityId: {
              serviceId,
              businessActivityId,
            },
          },
          create: {
            serviceId,
            businessActivityId,
          },
          update: {},
        }),
      ),
    );
  }

  private privacyData(input: PrivacyProfile) {
    return {
      supportedRights: jsonValue(input.supportedRights),
      requestMethods: jsonValue(input.requestMethods),
      responseTimelineDaysStatus: input.responseTimelineDaysStatus,
      responseTimelineDays: input.responseTimelineDays,
      identityVerificationRequired: input.identityVerificationRequired,
      authorizedAgentSupported: input.authorizedAgentSupported,
      appealProcessExists: input.appealProcessExists,
      sendsMarketingEmails: input.sendsMarketingEmails,
      marketingOptOutMethod: input.marketingOptOutMethod,
      transactionalEmailsSent: input.transactionalEmailsSent,
      crossBorderTransfers: input.crossBorderTransfers,
      transferMechanisms: jsonValue(input.transferMechanisms),
      sellsOrSharesData: input.sellsOrSharesData,
      doNotSellLink: input.doNotSellLink,
      dpoStatus: input.dpoStatus,
      dpoName: input.dpoName,
      dpoEmail: input.dpoEmail,
      euRepresentativeStatus: input.euRepresentativeStatus,
      euRepresentativeName: input.euRepresentativeName,
      euRepresentativeAddress: input.euRepresentativeAddress,
      usesAutomatedDecisionMaking: input.usesAutomatedDecisionMaking,
    };
  }

  private async syncOrganizationProviders(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ) {
    const selectedProviders: ProviderSelection[] = [
      ...input.infrastructure.organizationProviders,
      ...input.privacy.organizationProviders,
    ];
    const catalogProviders = selectedProviders.map((selectedProvider) => ({
      selectedProvider,
      provider: this.catalogProvider(
        providerCatalog,
        selectedProvider.systemType,
        selectedProvider.providerId,
      ),
    }));

    const managedSystemTypes = [
      "auth",
      "source_control",
      "cloud",
      "password_manager",
      "newsletter",
    ];
    const currentProviders = await this.client.organizationProvider.findMany({
      where: { organizationId },
    });
    const selectedByProviderId = new Map<string, Set<ProviderSystemType>>();
    const selectedByName = new Map<string, Set<ProviderSystemType>>();

    for (const { provider, selectedProvider } of catalogProviders) {
      const currentSystemTypes =
        selectedByProviderId.get(provider.id) ?? new Set<ProviderSystemType>();
      currentSystemTypes.add(selectedProvider.systemType);
      selectedByProviderId.set(provider.id, currentSystemTypes);

      const nameSystemTypes =
        selectedByName.get(provider.name) ?? new Set<ProviderSystemType>();
      nameSystemTypes.add(selectedProvider.systemType);
      selectedByName.set(provider.name, nameSystemTypes);
    }

    await Promise.all(
      currentProviders.map((provider) => {
        const selectedSystemTypes =
          (provider.providerId
            ? selectedByProviderId.get(provider.providerId)
            : undefined) ?? selectedByName.get(provider.name);
        const systemTypes = [
          ...provider.systemTypes.filter(
            (systemType) => !managedSystemTypes.includes(systemType),
          ),
          ...(selectedSystemTypes ? Array.from(selectedSystemTypes) : []),
        ];

        return this.client.organizationProvider.update({
          where: { id: provider.id },
          data: { systemTypes },
        });
      }),
    );

    const uniqueCatalogProviders = Array.from(
      new Map(
        catalogProviders.map(({ provider }) => [provider.id, provider]),
      ).values(),
    );

    await Promise.all(
      uniqueCatalogProviders.map(async (provider) => {
        const existing = await this.client.organizationProvider.findFirst({
          where: {
            organizationId,
            OR: [{ providerId: provider.id }, { name: provider.name }],
          },
        });

        if (existing) {
          if (existing.providerId !== provider.id) {
            return this.client.organizationProvider.update({
              where: { id: existing.id },
              data: { providerId: provider.id },
            });
          }
          return existing;
        }

        return this.client.organizationProvider.create({
          data: {
            organizationId,
            providerId: provider.id,
            systemTypes: Array.from(
              selectedByProviderId.get(provider.id) ?? [],
            ),
            ...this.organizationProviderData(provider),
          },
        });
      }),
    );
  }

  private catalogProvider(
    providerCatalog: Provider[],
    systemType: ProviderSystemType,
    providerId: string,
  ) {
    if (providerId === "none") {
      return {
        id: "none",
        name: "None",
        url: "",
        category: "",
        systemTypes: [systemType],
        securityCriticality: "Low",
        handlesCustomerData: false,
      };
    }

    const provider = providerCatalog.find(
      (catalogProvider) =>
        catalogProvider.id === providerId &&
        catalogProvider.systemTypes.includes(systemType),
    );

    if (!provider) {
      throw new ApiError(
        "PROVIDER_NOT_AVAILABLE_FOR_SYSTEM",
        "Selected provider is not available for the requested system type.",
        400,
        { providerId, systemType },
      );
    }

    return provider;
  }

  private organizationProviderData(provider: Provider) {
    return {
      name: provider.name,
      legalName: provider.legalName || "",
      category: provider.categoryCode || this.providerCategory(provider),
      countryOfRegistration: provider.countryOfRegistration || "",
      criticality: this.providerCriticality(provider),
      notes: null,
      purpose: null,
    };
  }

  private providerCategory(provider: Provider) {
    const normalizedCategory = provider.category?.trim().toLowerCase();

    if (normalizedCategory === "source control") {
      return "source_control";
    }

    if (normalizedCategory === "payments") {
      return "payments";
    }

    if (normalizedCategory === "project management") {
      return "project_management";
    }

    return "provider";
  }

  private providerCriticality(provider: Provider) {
    const normalizedCriticality = provider.securityCriticality?.toLowerCase();

    if (
      normalizedCriticality === "critical" ||
      normalizedCriticality === "high"
    ) {
      return "high";
    }

    if (normalizedCriticality === "low") {
      return "low";
    }

    return "medium";
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
      description: dataType.description,
      subjectTypes: jsonValue(dataType.subjectTypes),
      collectionMethods: jsonValue(dataType.collectionMethods),
      isSensitive: dataType.isSensitive,
      isRequired: dataType.isRequired,
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
            description: dataType.description,
            subjectTypes: dataType.subjectTypes,
            collectionMethods: dataType.collectionMethods,
            isSensitive: dataType.isSensitive,
            isRequired: dataType.isRequired,
          },
        }),
      ),
    );
  }

  private accessData(input: AccessProfile) {
    return {
      mfaRequired: input.mfaRequired,
      ssoEnabled: input.ssoEnabled,
      sharedAccountsExist: input.sharedAccountsExist,
      offboardingProcessExists: input.offboardingProcessExists,
      accessReviewsPerformed: input.accessReviewsPerformed,
      leastPrivilege: input.leastPrivilege,
      roleBasedAccess: input.roleBasedAccess,
      accessReviewCadence: input.accessReviewCadence,
      adminApprovalRequired: input.adminApprovalRequired,
      passwordManagerRequired: input.passwordManagerRequired,
    };
  }
}
