import { Prisma, PrismaClient } from "@prisma/client";
import {
  accessProfileSchema,
  businessActivitySchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  organizationProviderInventorySchema,
  infrastructureProfileSchema,
  securityProfileSchema,
  privacyProfileSchema,
  serviceProfileSchema,
  serviceProviderUsageSchema,
  documentSchema,
  type BusinessActivity,
  type OrganizationSecurityProfile,
  type Document,
  type ServiceProviderUsage,
  type Template,
  type OrganizationProvider,
  templateSchema,
} from "@plyco/shared";

export const prisma = new PrismaClient();

function toIsoString(value: Date) {
  return value.toISOString();
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

export function mapOrganizationRecord(record: {
  id: string;
  companyName: string;
  legalEntityName: string | null;
  website: string | null;
  contactEmail: string | null;
  securityContactEmail: string | null;
  privacyContactEmail: string | null;
  country: string | null;
  address: string | null;
  employeeCount: number | null;
  industries: unknown;
  regions: unknown;
  handlesPii: boolean | null;
  handlesSensitiveData: boolean | null;
  storesPii: boolean | null;
  storesHealthcareData: boolean | null;
  complianceGoals: unknown;
  serviceProfile?: {
    id: string;
    sortOrder: number;
    serviceName: string | null;
    serviceDescription: string | null;
    serviceUrl: string | null;
    userTypes: unknown;
    customerTypes: unknown;
    availabilityRegions: unknown;
    childrenDirected: boolean | null;
    minimumUserAge: number | null;
    usesCookiesOrTrackingTechnologies: boolean | null;
    cookieTrackingCategories: unknown;
    cookieConsentMechanism: string | null;
    doNotTrackResponse: boolean | null;
    globalPrivacyControlSupported: boolean | null;
    primaryHostingRegion: string | null;
    businessActivities?: Array<{
      businessActivityId: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  services?: Array<{
    id: string;
    sortOrder: number;
    serviceName: string | null;
    serviceDescription: string | null;
    serviceUrl: string | null;
    userTypes: unknown;
    customerTypes: unknown;
    availabilityRegions: unknown;
    childrenDirected: boolean | null;
    minimumUserAge: number | null;
    usesCookiesOrTrackingTechnologies: boolean | null;
    cookieTrackingCategories: unknown;
    cookieConsentMechanism: string | null;
    doNotTrackResponse: boolean | null;
    globalPrivacyControlSupported: boolean | null;
    primaryHostingRegion: string | null;
    businessActivities?: Array<{
      businessActivityId: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
  privacyProfile: {
    supportedRights: unknown;
    requestMethods: unknown;
    responseTimelineDaysStatus: string | null;
    responseTimelineDays: number | null;
    identityVerificationRequired: boolean | null;
    authorizedAgentSupported: boolean | null;
    appealProcessExists: boolean | null;
    sendsMarketingEmails: boolean | null;
    marketingOptOutMethod: string | null;
    transactionalEmailsSent: boolean | null;
    crossBorderTransfers: boolean | null;
    transferMechanisms: unknown;
    sellsOrSharesData: boolean | null;
    doNotSellLink: string | null;
    dpoStatus: string | null;
    dpoName: string | null;
    dpoEmail: string | null;
    euRepresentativeStatus: string | null;
    euRepresentativeName: string | null;
    euRepresentativeAddress: string | null;
    usesAutomatedDecisionMaking: boolean | null;
    productionDataInDevelopment: boolean | null;
    retentionPolicyExists: boolean | null;
  } | null;
  infrastructureProfile: {
    mfaEnabled: boolean | null;
    encryptedDevicesRequired: boolean | null;
    backupsEnabled: boolean | null;
    centralizedLoggingEnabled: boolean | null;
    securityMonitoring: string | null;
    atRestAlgorithm: string | null;
    inTransitMinimumTlsVersion: string | null;
    keyManagementProvider: string | null;
    backupCadence: string | null;
    backupRetentionDays: number | null;
    backupRetentionDaysStatus: string | null;
    restoreTestingCadence: string | null;
    vendorReviewRequired: boolean | null;
    vendorReviewCadence: string | null;
    dpaRequiredForProcessors: boolean | null;
    encryptionAtRest: boolean | null;
    encryptionInTransit: boolean | null;
    explicitNoProviderSystemTypes: string[];
  } | null;
  securityProfile: {
    codeReviewRequired: boolean | null;
    dependencySecurityMonitoring: boolean | null;
    secretScanning: boolean | null;
    automatedTestingBeforeDeployment: boolean | null;
    cicdDeploymentProcess: boolean | null;
    productionDeploymentApprovalRequired: boolean | null;
    scanningCadence: string | null;
    penetrationTestingStrategy: string | null;
    penetrationTestingCadence: string | null;
    penetrationTestLastDate: string | null;
    patchingSlaCriticalDays: number | null;
    patchingSlaCriticalDaysStatus: string | null;
    patchingSlaHighDays: number | null;
    patchingSlaHighDaysStatus: string | null;
    vulnerabilityDisclosureProgramExists: boolean | null;
    vulnerabilityDisclosureUrl: string | null;
    incidentResponsePlanExists: boolean | null;
    incidentNotificationTimeline: string | null;
    customerNotificationProcess: string | null;
    incidentResponseLastTestedDate: string | null;
  } | null;
  organizationProviders: Array<{
    providerId: string | null;
    systemTypes: string[];
    name: string;
  }>;
  dataTypes: Array<{
    id: string;
    sortOrder: number;
    name: string;
    description: string | null;
    subjectTypes: unknown;
    collectionMethods: unknown;
    isSensitive: boolean | null;
    isRequired: boolean | null;
  }>;
  accessProfile: {
    mfaRequired: boolean | null;
    ssoEnabled: boolean | null;
    sharedAccountsExist: boolean | null;
    offboardingProcessExists: boolean | null;
    accessReviewsPerformed: boolean | null;
    leastPrivilege: boolean | null;
    roleBasedAccess: boolean | null;
    accessReviewCadence: string | null;
    adminApprovalRequired: boolean | null;
    passwordManagerRequired: boolean | null;
    securityTrainingRequired: boolean | null;
    confidentialityAgreementsRequired: boolean | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationSecurityProfile {
  const infrastructureProviderSystemTypes = [
    "ai",
    "auth",
    "source_control",
    "cloud",
    "password_manager",
  ];
  const company = companyProfileSchema.parse({
    companyName: record.companyName,
    legalEntityName: record.legalEntityName,
    website: record.website,
    contactEmail: record.contactEmail,
    securityContactEmail: record.securityContactEmail,
    privacyContactEmail: record.privacyContactEmail,
    country: record.country,
    address: record.address,
    employeeCount: record.employeeCount,
    industries: stringArray(record.industries),
    regions: stringArray(record.regions),
    handlesPii: record.handlesPii,
    handlesSensitiveData: record.handlesSensitiveData,
    storesPii: record.storesPii,
    storesHealthcareData: record.storesHealthcareData,
    complianceGoals: stringArray(record.complianceGoals),
  });
  const infrastructure = infrastructureProfileSchema.parse({
    organizationProviders: [
      ...record.organizationProviders.flatMap((provider) =>
        provider.providerId
          ? provider.systemTypes.flatMap((systemType) =>
              infrastructureProviderSystemTypes.includes(systemType)
                ? [
                    {
                      providerId: provider.providerId,
                      systemType,
                      name: provider.name,
                    },
                  ]
                : [],
            )
          : [],
      ),
      ...(record.infrastructureProfile?.explicitNoProviderSystemTypes ?? [])
        .filter((systemType) =>
          infrastructureProviderSystemTypes.includes(systemType),
        )
        .map((systemType) => ({
          providerId: "none",
          systemType,
          name: "None",
        })),
    ],
    mfaEnabled: record.infrastructureProfile?.mfaEnabled ?? null,
    encryptedDevicesRequired:
      record.infrastructureProfile?.encryptedDevicesRequired ?? null,
    backupsEnabled: record.infrastructureProfile?.backupsEnabled ?? null,
    centralizedLoggingEnabled:
      record.infrastructureProfile?.centralizedLoggingEnabled ?? null,
    securityMonitoring:
      record.infrastructureProfile?.securityMonitoring ?? null,
    atRestAlgorithm: record.infrastructureProfile?.atRestAlgorithm ?? null,
    inTransitMinimumTlsVersion:
      record.infrastructureProfile?.inTransitMinimumTlsVersion ?? null,
    keyManagementProvider:
      record.infrastructureProfile?.keyManagementProvider ?? null,
    backupCadence: record.infrastructureProfile?.backupCadence ?? null,
    backupRetentionDays:
      record.infrastructureProfile?.backupRetentionDays ?? null,
    backupRetentionDaysStatus:
      record.infrastructureProfile?.backupRetentionDaysStatus ?? null,
    restoreTestingCadence:
      record.infrastructureProfile?.restoreTestingCadence ?? null,
    vendorReviewRequired:
      record.infrastructureProfile?.vendorReviewRequired ?? null,
    vendorReviewCadence:
      record.infrastructureProfile?.vendorReviewCadence ?? null,
    dpaRequiredForProcessors:
      record.infrastructureProfile?.dpaRequiredForProcessors ?? null,
    encryptionAtRest: record.infrastructureProfile?.encryptionAtRest ?? null,
    encryptionInTransit:
      record.infrastructureProfile?.encryptionInTransit ?? null,
  });
  const security = securityProfileSchema.parse({
    codeReviewRequired: record.securityProfile?.codeReviewRequired ?? null,
    dependencySecurityMonitoring:
      record.securityProfile?.dependencySecurityMonitoring ?? null,
    secretScanning: record.securityProfile?.secretScanning ?? null,
    automatedTestingBeforeDeployment:
      record.securityProfile?.automatedTestingBeforeDeployment ?? null,
    cicdDeploymentProcess:
      record.securityProfile?.cicdDeploymentProcess ?? null,
    productionDeploymentApprovalRequired:
      record.securityProfile?.productionDeploymentApprovalRequired ?? null,
    scanningCadence: record.securityProfile?.scanningCadence ?? null,
    penetrationTestingStrategy:
      record.securityProfile?.penetrationTestingStrategy ?? null,
    penetrationTestingCadence:
      record.securityProfile?.penetrationTestingCadence ?? null,
    penetrationTestLastDate:
      record.securityProfile?.penetrationTestLastDate ?? null,
    patchingSlaCriticalDays:
      record.securityProfile?.patchingSlaCriticalDays ?? null,
    patchingSlaCriticalDaysStatus:
      record.securityProfile?.patchingSlaCriticalDaysStatus ?? null,
    patchingSlaHighDays: record.securityProfile?.patchingSlaHighDays ?? null,
    patchingSlaHighDaysStatus:
      record.securityProfile?.patchingSlaHighDaysStatus ?? null,
    vulnerabilityDisclosureProgramExists:
      record.securityProfile?.vulnerabilityDisclosureProgramExists ?? null,
    vulnerabilityDisclosureUrl:
      record.securityProfile?.vulnerabilityDisclosureUrl ?? null,
    incidentResponsePlanExists:
      record.securityProfile?.incidentResponsePlanExists ?? null,
    incidentNotificationTimeline:
      record.securityProfile?.incidentNotificationTimeline ?? null,
    customerNotificationProcess:
      record.securityProfile?.customerNotificationProcess ?? null,
    incidentResponseLastTestedDate:
      record.securityProfile?.incidentResponseLastTestedDate ?? null,
  });
  const serviceRecords =
    record.services ?? (record.serviceProfile ? [record.serviceProfile] : []);
  const services = serviceRecords.flatMap((service) =>
    service
      ? [
          serviceProfileSchema.parse({
            id: service.id,
            sortOrder: service.sortOrder,
            serviceName: service.serviceName,
            serviceDescription: service.serviceDescription,
            serviceUrl: service.serviceUrl,
            businessActivityIds:
              service.businessActivities?.map(
                (activity) => activity.businessActivityId,
              ) ?? [],
            userTypes: stringArray(service.userTypes),
            customerTypes: stringArray(service.customerTypes),
            availabilityRegions: stringArray(service.availabilityRegions),
            childrenDirected: service.childrenDirected,
            minimumUserAge: service.minimumUserAge,
            privacy: {
              usesCookiesOrTrackingTechnologies:
                service.usesCookiesOrTrackingTechnologies,
              cookieTrackingCategories: stringArray(
                service.cookieTrackingCategories,
              ),
              cookieConsentMechanism: service.cookieConsentMechanism,
              doNotTrackResponse: service.doNotTrackResponse,
              globalPrivacyControlSupported:
                service.globalPrivacyControlSupported,
              primaryHostingRegion: service.primaryHostingRegion,
            },
            createdAt: toIsoString(service.createdAt),
            updatedAt: toIsoString(service.updatedAt),
          }),
        ]
      : [],
  );
  const privacy = privacyProfileSchema.parse({
    supportedRights: stringArray(record.privacyProfile?.supportedRights),
    requestMethods: stringArray(record.privacyProfile?.requestMethods),
    responseTimelineDaysStatus:
      record.privacyProfile?.responseTimelineDaysStatus ?? null,
    responseTimelineDays: record.privacyProfile?.responseTimelineDays ?? null,
    identityVerificationRequired:
      record.privacyProfile?.identityVerificationRequired ?? null,
    authorizedAgentSupported:
      record.privacyProfile?.authorizedAgentSupported ?? null,
    appealProcessExists: record.privacyProfile?.appealProcessExists ?? null,
    organizationProviders: [
      ...record.organizationProviders.flatMap((provider) =>
        provider.providerId && provider.systemTypes.includes("newsletter")
          ? [
              {
                providerId: provider.providerId,
                systemType: "newsletter" as const,
                name: provider.name,
              },
            ]
          : [],
      ),
      ...(record.infrastructureProfile?.explicitNoProviderSystemTypes.includes(
        "newsletter",
      )
        ? [
            {
              providerId: "none",
              systemType: "newsletter" as const,
              name: "None",
            },
          ]
        : []),
    ],
    sendsMarketingEmails: record.privacyProfile?.sendsMarketingEmails ?? null,
    marketingOptOutMethod: record.privacyProfile?.marketingOptOutMethod ?? null,
    transactionalEmailsSent:
      record.privacyProfile?.transactionalEmailsSent ?? null,
    crossBorderTransfers: record.privacyProfile?.crossBorderTransfers ?? null,
    transferMechanisms: stringArray(record.privacyProfile?.transferMechanisms),
    sellsOrSharesData: record.privacyProfile?.sellsOrSharesData ?? null,
    doNotSellLink: record.privacyProfile?.doNotSellLink ?? null,
    dpoStatus: record.privacyProfile?.dpoStatus ?? null,
    dpoName: record.privacyProfile?.dpoName ?? null,
    dpoEmail: record.privacyProfile?.dpoEmail ?? null,
    euRepresentativeStatus:
      record.privacyProfile?.euRepresentativeStatus ?? null,
    euRepresentativeName: record.privacyProfile?.euRepresentativeName ?? null,
    euRepresentativeAddress:
      record.privacyProfile?.euRepresentativeAddress ?? null,
    usesAutomatedDecisionMaking:
      record.privacyProfile?.usesAutomatedDecisionMaking ?? null,
    productionDataInDevelopment:
      record.privacyProfile?.productionDataInDevelopment ?? null,
    retentionPolicyExists: record.privacyProfile?.retentionPolicyExists ?? null,
  });
  const dataHandling = dataHandlingProfileSchema.parse({
    dataTypesStored: record.dataTypes.map((dataType) => ({
      id: dataType.id,
      sortOrder: dataType.sortOrder,
      name: dataType.name,
      description: dataType.description,
      subjectTypes: stringArray(dataType.subjectTypes),
      collectionMethods: stringArray(dataType.collectionMethods),
      isSensitive: dataType.isSensitive,
      isRequired: dataType.isRequired,
    })),
  });
  const access = accessProfileSchema.parse({
    mfaRequired: record.accessProfile?.mfaRequired ?? null,
    ssoEnabled: record.accessProfile?.ssoEnabled ?? null,
    sharedAccountsExist: record.accessProfile?.sharedAccountsExist ?? null,
    offboardingProcessExists:
      record.accessProfile?.offboardingProcessExists ?? null,
    accessReviewsPerformed:
      record.accessProfile?.accessReviewsPerformed ?? null,
    leastPrivilege: record.accessProfile?.leastPrivilege ?? null,
    roleBasedAccess: record.accessProfile?.roleBasedAccess ?? null,
    accessReviewCadence: record.accessProfile?.accessReviewCadence ?? null,
    adminApprovalRequired: record.accessProfile?.adminApprovalRequired ?? null,
    passwordManagerRequired:
      record.accessProfile?.passwordManagerRequired ?? null,
    securityTrainingRequired:
      record.accessProfile?.securityTrainingRequired ?? null,
    confidentialityAgreementsRequired:
      record.accessProfile?.confidentialityAgreementsRequired ?? null,
  });

  return {
    id: record.id,
    company,
    services,
    privacy,
    infrastructure,
    security,
    dataHandling,
    access,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function mapBusinessActivityRecord(record: {
  id: string;
  sortOrder: number;
  name: string;
  purpose: string;
  role: string;
  legalBasis: string[];
  usesAi: boolean | null;
  aiUseCases: string;
  aiCustomerDataUsedForTraining: boolean | null;
  aiCustomerDataSentToProviders: boolean | null;
  aiHumanReviewOfOutputs: boolean | null;
  aiUsersInformedWhenUsed: boolean | null;
  dataTypes?: Array<{
    organizationDataTypeId: string;
  }>;
  retentionDays: number;
  retentionPolicy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BusinessActivity {
  return businessActivitySchema.parse({
    id: record.id,
    sortOrder: record.sortOrder,
    name: record.name,
    purpose: record.purpose,
    role: record.role,
    legalBasis: record.legalBasis,
    usesAi: record.usesAi,
    aiUseCases: record.aiUseCases,
    aiCustomerDataUsedForTraining: record.aiCustomerDataUsedForTraining,
    aiCustomerDataSentToProviders: record.aiCustomerDataSentToProviders,
    aiHumanReviewOfOutputs: record.aiHumanReviewOfOutputs,
    aiUsersInformedWhenUsed: record.aiUsersInformedWhenUsed,
    dataTypeIds:
      record.dataTypes?.map((dataType) => dataType.organizationDataTypeId) ??
      [],
    retentionPolicy: record.retentionPolicy,
    retentionDays: record.retentionDays,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  });
}

export function mapOrganizationProviderRecord(record: {
  id: string;
  providerId?: string | null;
  systemTypes: string[];
  name: string;
  legalName: string;
  category: string;
  countryOfRegistration: string;
  criticality: string;
  notes: string | null;
  purpose: string | null;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationProvider {
  return organizationProviderInventorySchema.parse({
    id: record.id,
    providerId: record.providerId ?? "",
    systemTypes: record.systemTypes,
    name: record.name,
    legalName: record.legalName,
    category: record.category,
    countryOfRegistration: record.countryOfRegistration,
    criticality: record.criticality,
    notes: record.notes ?? "",
    purpose: record.purpose ?? "",
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  });
}

export function mapServiceProviderUsageRecord(record: {
  id: string;
  serviceId: string;
  service?: {
    serviceName: string | null;
  } | null;
  organizationProviderId: string;
  organizationProvider?: {
    name: string;
  } | null;
  systemType: string | null;
  purpose: string;
  dataProcessingLevel: string;
  dpaStatus: string | null;
  dataRegions: string[];
  dataTypes: Array<{
    organizationDataType: {
      name: string;
    };
  }>;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ServiceProviderUsage {
  return serviceProviderUsageSchema.parse({
    id: record.id,
    serviceId: record.serviceId,
    serviceName: record.service?.serviceName ?? "",
    organizationProviderId: record.organizationProviderId,
    providerName: record.organizationProvider?.name ?? "",
    systemType: record.systemType,
    purpose: record.purpose,
    dataProcessingLevel: record.dataProcessingLevel,
    dataProcessed: record.dataTypes.map(
      (dataType) => dataType.organizationDataType.name,
    ),
    dpaStatus: record.dpaStatus,
    dataRegions: record.dataRegions,
    notes: record.notes ?? "",
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  });
}

export function mapTemplateRecord(record: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  sourceSystemTemplateSlug: string | null;
  content: string;
  versionMajor: number;
  versionMinor: number;
  createdAt: Date;
  updatedAt: Date;
}): Template {
  return templateSchema.parse({
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    slug: record.slug,
    sourceSystemTemplateSlug: record.sourceSystemTemplateSlug,
    content: record.content,
    versionMajor: record.versionMajor,
    versionMinor: record.versionMinor,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  });
}

export function mapDocumentRecord(record: {
  id: string;
  organizationId: string;
  templateId: string;
  title: string;
  renderedContent: string;
  pdfObjectPath: string | null;
  sourceHash: string;
  sourceFingerprint: unknown;
  templateVersionMajor: number;
  templateVersionMinor: number;
  generatedAt: Date;
}): Document {
  return documentSchema.parse({
    id: record.id,
    organizationId: record.organizationId,
    templateId: record.templateId,
    title: record.title,
    renderedContent: record.renderedContent,
    hasPdf: Boolean(record.pdfObjectPath),
    sourceHash: record.sourceHash,
    sourceFingerprint: record.sourceFingerprint,
    templateVersionMajor: record.templateVersionMajor,
    templateVersionMinor: record.templateVersionMinor,
    generatedAt: toIsoString(record.generatedAt),
  });
}

export { Prisma };
export type { PrismaClient };
