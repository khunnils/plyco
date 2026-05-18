import { mapOrganizationRecord, prisma, type PrismaClient } from "@plyco/db"
import {
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type OrganizationSecurityProfile,
  type PrivacyProfile,
  type Provider,
  type ProviderSystemType,
  type ServiceProfile,
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
  serviceProfile: true,
  vendors: {
    select: {
      name: true,
      providerId: true,
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
    const serviceData = this.serviceData(input.service)
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
        serviceProfile: {
          upsert: {
            create: serviceData,
            update: serviceData,
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
    await this.syncOrganizationProviders(organization.id, input, providerCatalog)

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
    }
  }

  private serviceData(input: ServiceProfile) {
    return {
      serviceName: input.serviceName,
      serviceDescription: input.serviceDescription,
      serviceUrl: input.serviceUrl,
      audiences: input.audiences,
      userTypes: input.userTypes,
      customerTypes: input.customerTypes,
      availabilityRegions: input.availabilityRegions,
      childrenDirected: input.childrenDirected,
      minimumUserAge: input.minimumUserAge,
    }
  }

  private privacyData(input: PrivacyProfile) {
    return {
      supportedRights: input.supportedRights,
      requestMethods: input.requestMethods,
      responseTimelineDays: input.responseTimelineDays,
      identityVerificationRequired: input.identityVerificationRequired,
      authorizedAgentSupported: input.authorizedAgentSupported,
      appealProcessExists: input.appealProcessExists,
      usesCookies: input.usesCookies,
      cookieTypes: input.cookieTypes,
      cookieConsentMechanism: input.cookieConsentMechanism,
      doNotTrackResponse: input.doNotTrackResponse,
      globalPrivacyControlSupported: input.globalPrivacyControlSupported,
    }
  }

  private async syncOrganizationProviders(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ) {
    const selectedProviders = [
      ...input.infrastructure.organizationProviders,
      ...input.privacy.organizationProviders,
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
          ],
        },
        ...(selectedProviders.length > 0
          ? {
              NOT: selectedProviders.map((provider) => ({
                systemType: provider.systemType,
                providerId: provider.providerId,
              })),
            }
          : {}),
      },
    })

    await Promise.all(
      catalogProviders.map(({ provider, selectedProvider }) =>
        this.client.organizationProvider.upsert({
          where: {
            organizationId_systemType_providerId: {
              organizationId,
              systemType: selectedProvider.systemType,
              providerId: selectedProvider.providerId,
            },
          },
          create: {
            organizationId,
            providerId: provider.id,
            systemType: selectedProvider.systemType,
            ...this.organizationProviderData(provider),
          },
          update: this.organizationProviderData(provider),
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
      purposes: dataType.purposes,
      collectionMethods: dataType.collectionMethods,
      legalBasis: dataType.legalBasis,
      retentionDays: dataType.retentionDays,
      isSensitive: dataType.isSensitive,
      isRequired: dataType.isRequired,
      sharedWithThirdParties: dataType.sharedWithThirdParties,
      thirdParties: dataType.thirdParties,
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
            purposes: dataType.purposes,
            collectionMethods: dataType.collectionMethods,
            legalBasis: dataType.legalBasis,
            retentionDays: dataType.retentionDays,
            isSensitive: dataType.isSensitive,
            isRequired: dataType.isRequired,
            sharedWithThirdParties: dataType.sharedWithThirdParties,
            thirdParties: dataType.thirdParties,
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
    }
  }
}
