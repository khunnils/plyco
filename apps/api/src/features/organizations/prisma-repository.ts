import { mapOrganizationRecord, prisma, type PrismaClient } from "@plyco/db"
import {
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type OrganizationProvider,
  type OrganizationSecurityProfile,
  type PrivacyProfile,
  type Provider,
  type ProviderSystemType,
  type ServiceProfileInput,
} from "@plyco/shared"

import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js"
import { ApiError } from "../../errors.js"

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
  vendors: {
    select: {
      name: true,
      providerId: true,
      serviceId: true,
      systemType: true,
    },
  },
} as const

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getOrganization(
    organizationId: string,
  ): Promise<OrganizationSecurityProfile | null> {
    const organization = await this.client.organization.findUnique({
      where: { id: organizationId },
      include: ORGANIZATION_INCLUDE,
    })

    return organization ? mapOrganizationRecord(organization) : null
  }

  async upsertProfile(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile> {
    const organizationData = this.organizationData(input.company)
    const infrastructureData = this.infrastructureData(input.infrastructure)
    const dataHandlingData = this.dataHandlingData(input.dataHandling)
    const privacyData = this.privacyData(input.privacy)
    const accessData = this.accessData(input.access)

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
    })

    await this.syncOrganizationDataTypes(organization.id, input.dataHandling)
    const services = await this.syncServices(organization.id, input.services)
    await this.syncOrganizationProviders(
      organization.id,
      { ...input, services },
      providerCatalog,
    )

    return mapOrganizationRecord(
      await this.client.organization.findUniqueOrThrow({
        where: { id: organization.id },
        include: ORGANIZATION_INCLUDE,
      }),
    )
  }

  async listDataTypeNames(organizationId: string): Promise<string[]> {
    const dataTypes = await this.client.organizationDataType.findMany({
      where: { organizationId },
      select: { name: true },
    })

    return dataTypes.map((dataType) => dataType.name)
  }

  async listServiceIds(organizationId: string): Promise<string[]> {
    const services = await this.client.serviceProfile.findMany({
      where: { organizationId },
      select: { id: true },
    })

    return services.map((service) => service.id)
  }

  async listBusinessActivityIds(organizationId: string): Promise<string[]> {
    const activities = await this.client.businessActivity.findMany({
      where: { organizationId },
      select: { id: true },
    })

    return activities.map((activity) => activity.id)
  }

  async listVendorIds(organizationId: string): Promise<string[]> {
    const vendors = await this.client.vendorMaster.findMany({
      where: { organizationId },
      select: { id: true },
    })

    return vendors.map((vendor) => vendor.id)
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
      industries: input.industries,
      regions: input.regions,
      handlesPii: input.handlesPii,
      handlesSensitiveData: input.handlesSensitiveData,
      complianceGoals: input.complianceGoals,
    }
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
      securityMonitoringOwner: input.securityMonitoringOwner,
      scanningCadence: input.scanningCadence,
      patchingSlaCriticalDays: input.patchingSlaCriticalDays,
      patchingSlaHighDays: input.patchingSlaHighDays,
      incidentResponsePlanExists: input.incidentResponsePlanExists,
      incidentNotificationTimeline: input.incidentNotificationTimeline,
      customerNotificationProcess: input.customerNotificationProcess,
      incidentResponseLastTestedDate: input.incidentResponseLastTestedDate,
      backupCadence: input.backupCadence,
      backupRetentionDays: input.backupRetentionDays,
      restoreTestingCadence: input.restoreTestingCadence,
      vendorReviewRequired: input.vendorReviewRequired,
      vendorReviewCadence: input.vendorReviewCadence,
      dpaRequiredForProcessors: input.dpaRequiredForProcessors,
    }
  }

  private serviceData(input: ServiceProfileInput) {
    return {
      serviceName: input.serviceName,
      serviceDescription: input.serviceDescription,
      serviceUrl: input.serviceUrl,
      userTypes: input.userTypes,
      customerTypes: input.customerTypes,
      availabilityRegions: input.availabilityRegions,
      childrenDirected: input.childrenDirected,
      minimumUserAge: input.minimumUserAge,
      usesCookies: input.privacy.usesCookies,
      cookieTypes: input.privacy.cookieTypes,
      primaryHostingRegion: input.privacy.primaryHostingRegion,
      dataResidencyOptions: input.privacy.dataResidencyOptions,
    }
  }

  private async syncServices(
    organizationId: string,
    services: ServiceProfileInput[],
  ): Promise<ServiceProfileInput[]> {
    const existingServices = await this.client.serviceProfile.findMany({
      where: { organizationId },
      select: { id: true },
    })
    const existingBusinessActivityIds = new Set(
      await this.listBusinessActivityIds(organizationId),
    )
    const existingIds = new Set(existingServices.map((service) => service.id))
    const resolvedServices = services.map((service, index) => ({
      ...service,
      id: service.id ?? existingServices[index]?.id,
    }))
    const requestedIds = resolvedServices.flatMap((service) =>
      service.id ? [service.id] : [],
    )
    const unknownId = requestedIds.find((id) => !existingIds.has(id))

    if (unknownId) {
      throw new ApiError(
        "SERVICE_NOT_FOUND",
        "Service was not found for this organization.",
        400,
        { serviceId: unknownId },
      )
    }

    const requestedActivityIds = Array.from(
      new Set(resolvedServices.flatMap((service) => service.businessActivityIds)),
    )
    const unknownActivityId = requestedActivityIds.find(
      (id) => !existingBusinessActivityIds.has(id),
    )

    if (unknownActivityId) {
      throw new ApiError(
        "BUSINESS_ACTIVITY_NOT_FOUND",
        "Service activity must reference a business activity on the organization.",
        400,
        { businessActivityId: unknownActivityId },
      )
    }

    await this.client.serviceProfile.deleteMany({
      where: {
        organizationId,
        ...(requestedIds.length > 0 ? { id: { notIn: requestedIds } } : {}),
      },
    })

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
            })

        await this.syncServiceBusinessActivities(
          record.id,
          service.businessActivityIds,
        )

        return { ...service, id: record.id }
      }),
    )
  }

  private async syncServiceBusinessActivities(
    serviceId: string,
    businessActivityIds: string[],
  ) {
    const requestedIds = Array.from(new Set(businessActivityIds))

    await this.client.serviceBusinessActivity.deleteMany({
      where: {
        serviceId,
        ...(requestedIds.length > 0
          ? { businessActivityId: { notIn: requestedIds } }
          : {}),
      },
    })

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
    )
  }

  private privacyData(input: PrivacyProfile) {
    return {
      supportedRights: input.supportedRights,
      requestMethods: input.requestMethods,
      responseTimelineDays: input.responseTimelineDays,
      identityVerificationRequired: input.identityVerificationRequired,
      authorizedAgentSupported: input.authorizedAgentSupported,
      appealProcessExists: input.appealProcessExists,
      cookieConsentMechanism: input.cookieConsentMechanism,
      doNotTrackResponse: input.doNotTrackResponse,
      globalPrivacyControlSupported: input.globalPrivacyControlSupported,
      sendsMarketingEmails: input.sendsMarketingEmails,
      marketingOptOutMethod: input.marketingOptOutMethod,
      transactionalEmailsSent: input.transactionalEmailsSent,
      crossBorderTransfers: input.crossBorderTransfers,
      transferMechanisms: input.transferMechanisms,
      sellsOrSharesData: input.sellsOrSharesData,
      doNotSellLink: input.doNotSellLink,
      dpoName: input.dpoName,
      dpoEmail: input.dpoEmail,
      euRepresentativeName: input.euRepresentativeName,
      euRepresentativeAddress: input.euRepresentativeAddress,
      usesAutomatedDecisionMaking: input.usesAutomatedDecisionMaking,
    }
  }

  private async syncOrganizationProviders(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ) {
    const selectedProviders: Array<OrganizationProvider & { serviceId?: string }> = [
      ...input.infrastructure.organizationProviders.map((provider) => ({
        ...provider,
        serviceId: undefined,
      })),
      ...input.privacy.organizationProviders.map((provider) => ({
        ...provider,
        serviceId: undefined,
      })),
      ...input.services.flatMap((service) => [
        ...service.privacy.analyticsProviders.map((provider) => ({
          ...provider,
          serviceId: service.id,
        })),
        ...service.privacy.advertisingProviders.map((provider) => ({
          ...provider,
          serviceId: service.id,
        })),
      ]),
    ]
    const catalogProviders = selectedProviders.map((selectedProvider) => ({
      selectedProvider,
      provider: this.catalogProvider(
        providerCatalog,
        selectedProvider.systemType,
        selectedProvider.providerId,
      ),
    }))

    await this.client.organizationProvider.deleteMany({
      where: {
        organizationId,
        systemType: {
          in: [
            "auth",
            "source_control",
            "cloud",
            "password_manager",
            "analytics",
            "advertising",
            "newsletter",
          ],
        },
      },
    })

    await Promise.all(
      catalogProviders.map(({ provider, selectedProvider }) =>
        this.client.organizationProvider.create({
          data: {
            organizationId,
            serviceId: selectedProvider.serviceId ?? null,
            providerId: provider.id,
            systemType: selectedProvider.systemType,
            ...this.organizationProviderData(provider),
          },
        })
      ),
    )
  }

  private catalogProvider(
    providerCatalog: Provider[],
    systemType: ProviderSystemType,
    providerId: string,
  ) {
    const provider = providerCatalog.find(
      (catalogProvider) =>
        catalogProvider.id === providerId &&
        catalogProvider.systemTypes.includes(systemType),
    )

    if (!provider) {
      throw new ApiError(
        "PROVIDER_NOT_AVAILABLE_FOR_SYSTEM",
        "Selected provider is not available for the requested system type.",
        400,
        { providerId, systemType },
      )
    }

    return provider
  }

  private organizationProviderData(provider: Provider) {
    return {
      name: provider.name,
      legalName: "",
      displayName: provider.name,
      providerOrganizationName: provider.name,
      providerOrganizationLegalName: "",
      privacyPolicyUrl: "",
      dpaUrl: "",
      securityPageUrl: "",
      category: this.providerCategory(provider),
      purpose: provider.url
        ? `Operational provider listed at ${provider.url}`
        : "Operational provider",
      countryOfRegistration: "",
      hasSubprocessors: false,
      dataProcessingLevel: provider.handlesCustomerData ? "limited" : "none",
      dpaStatus: "not_started",
      dataRegions: [],
      criticality: this.providerCriticality(provider),
      owner: null,
      notes: provider.securityCriticality
        ? `Provider catalog criticality: ${provider.securityCriticality}`
        : null,
    }
  }

  private providerCategory(provider: Provider) {
    const normalizedCategory = provider.category?.trim().toLowerCase()

    if (normalizedCategory === "source control") {
      return "source_control"
    }

    if (normalizedCategory === "payments") {
      return "payments"
    }

    if (normalizedCategory === "project management") {
      return "project_management"
    }

    return "provider"
  }

  private providerCriticality(provider: Provider) {
    const normalizedCriticality = provider.securityCriticality?.toLowerCase()

    if (
      normalizedCriticality === "critical" ||
      normalizedCriticality === "high"
    ) {
      return "high"
    }

    if (normalizedCriticality === "low") {
      return "low"
    }

    return "medium"
  }

  private dataHandlingData(input: DataHandlingProfile) {
    return {
      storesPii: input.storesPii,
      storesHealthcareData: input.storesHealthcareData,
      encryptionAtRest: input.encryptionAtRest,
      encryptionInTransit: input.encryptionInTransit,
      productionDataInDevelopment: input.productionDataInDevelopment,
      retentionPolicyExists: input.retentionPolicyExists,
    }
  }

  private organizationDataTypes(input: DataHandlingProfile) {
    return input.dataTypesStored.map((dataType) => ({
      name: dataType.name,
      description: dataType.description,
      subjectTypes: dataType.subjectTypes,
      collectionMethods: dataType.collectionMethods,
      retentionDays: dataType.retentionDays,
      isSensitive: dataType.isSensitive,
      isRequired: dataType.isRequired,
    }))
  }

  private async syncOrganizationDataTypes(
    organizationId: string,
    input: DataHandlingProfile,
  ) {
    const dataTypes = this.organizationDataTypes(input)
    const names = dataTypes.map((dataType) => dataType.name)

    await this.client.organizationDataType.deleteMany({
      where: {
        organizationId,
        name: { notIn: names },
      },
    })

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
            retentionDays: dataType.retentionDays,
            isSensitive: dataType.isSensitive,
            isRequired: dataType.isRequired,
          },
        }),
      ),
    )
  }

  private accessData(input: AccessProfile) {
    return {
      mfaRequired: input.mfaRequired,
      ssoEnabled: input.ssoEnabled,
      sharedAccountsExist: input.sharedAccountsExist,
      offboardingProcessExists: input.offboardingProcessExists,
      accessReviewsPerformed: input.accessReviewsPerformed,
      privilegedAccessRestricted: input.privilegedAccessRestricted,
      leastPrivilege: input.leastPrivilege,
      roleBasedAccess: input.roleBasedAccess,
      accessReviewCadence: input.accessReviewCadence,
      adminApprovalRequired: input.adminApprovalRequired,
      passwordManagerRequired: input.passwordManagerRequired,
    }
  }
}
