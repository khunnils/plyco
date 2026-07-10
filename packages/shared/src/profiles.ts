import { z } from "zod";

import {
  codeIdSchema,
  nullableBooleanSchema,
  nullableCodeIdArraySchema,
  nullableCodeIdSchema,
  nullableCountryCodeSchema,
  nullableNumberSchema,
  nullableStringSchema,
} from "./common.js";
import {
  organizationProviderInventorySchema,
  providerSelectionSchema,
  serviceProviderUsageSchema,
} from "./providers.js";

export const storedDataTypeSchema = z.object({
  id: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).default(0),
  name: z.string().trim().min(1, "Name is required"),
  description: nullableStringSchema,
  subjectTypes: nullableCodeIdArraySchema,
  collectionMethods: nullableCodeIdArraySchema,
  isSensitive: nullableBooleanSchema,
  isRequired: nullableBooleanSchema,
});

export const businessActivityInputSchema = z.object({
  name: z.string().trim().min(1, "Activity name is required"),
  purpose: z.string().trim().default(""),
  role: codeIdSchema.or(z.literal("")).default(""),
  legalBasis: z.array(codeIdSchema).default([]),
  dataTypeIds: z.array(z.string().trim().min(1)).default([]),
  retentionPolicy: nullableCodeIdSchema,
  retentionDays: z.number().int().min(0).default(0),
  usesAi: nullableBooleanSchema,
  aiUseCases: z.string().trim().default(""),
  aiCustomerDataUsedForTraining: nullableBooleanSchema,
  aiCustomerDataSentToProviders: nullableBooleanSchema,
  aiHumanReviewOfOutputs: nullableBooleanSchema,
  aiUsersInformedWhenUsed: nullableBooleanSchema,
});

export const businessActivitySchema = businessActivityInputSchema.extend({
  id: z.string().min(1),
  sortOrder: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  legalEntityName: nullableStringSchema,
  website: nullableStringSchema,
  contactEmail: nullableStringSchema,
  securityContactEmail: nullableStringSchema,
  privacyContactEmail: nullableStringSchema,
  country: nullableCountryCodeSchema,
  address: nullableStringSchema,
  employeeCount: nullableNumberSchema(z.number().int().min(1).max(100000)),
  industries: nullableCodeIdArraySchema,
  regions: nullableCodeIdArraySchema,
  handlesPii: nullableBooleanSchema,
  handlesSensitiveData: nullableBooleanSchema,
  storesPii: nullableBooleanSchema,
  storesHealthcareData: nullableBooleanSchema,
  complianceGoals: nullableCodeIdArraySchema,
});

export const servicePrivacyProfileSchema = z.object({
  usesCookiesOrTrackingTechnologies: nullableBooleanSchema,
  cookieTrackingCategories: nullableCodeIdArraySchema,
  cookieConsentMechanism: nullableCodeIdSchema,
  nonEssentialCookiesBlockedUntilConsent: nullableBooleanSchema,
  cookieRejectAsEasyAsAccept: nullableBooleanSchema,
  cookieConsentWithdrawalMethod: nullableCodeIdSchema,
  cookieConsentNoPretickedBoxes: nullableBooleanSchema,
  doNotTrackResponse: nullableBooleanSchema,
  globalPrivacyControlSupported: nullableBooleanSchema,
  primaryHostingRegion: nullableCodeIdSchema,
});

export const serviceProfileInputSchema = z.object({
  id: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).default(0),
  serviceName: nullableStringSchema,
  serviceDescription: nullableStringSchema,
  serviceUrl: nullableStringSchema,
  businessActivityIds: z.array(z.string().min(1)).default([]),
  userTypes: nullableCodeIdArraySchema,
  customerTypes: nullableCodeIdArraySchema,
  availabilityRegions: nullableCodeIdArraySchema,
  childrenDirected: nullableBooleanSchema,
  minimumUserAge: nullableNumberSchema(z.number().int().min(0).max(120)),
  privacy: servicePrivacyProfileSchema,
});

export const serviceProfileSchema = serviceProfileInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const privacyProfileSchema = z.object({
  supportedRights: nullableCodeIdArraySchema,
  requestMethods: nullableCodeIdArraySchema,
  responseTimelineDaysStatus: nullableCodeIdSchema,
  responseTimelineDays: nullableNumberSchema(z.number().int().min(0)),
  identityVerificationRequired: nullableBooleanSchema,
  authorizedAgentSupported: nullableBooleanSchema,
  appealProcessExists: nullableBooleanSchema,
  organizationProviders: z.array(providerSelectionSchema).default([]),
  sendsMarketingEmails: nullableBooleanSchema,
  marketingOptOutMethod: nullableCodeIdSchema,
  transactionalEmailsSent: nullableBooleanSchema,
  crossBorderTransfers: nullableBooleanSchema,
  transferMechanisms: nullableCodeIdArraySchema,
  sellsOrSharesData: nullableBooleanSchema,
  doNotSellLink: nullableStringSchema,
  dpoStatus: nullableCodeIdSchema,
  dpoName: nullableStringSchema,
  dpoEmail: nullableStringSchema,
  euRepresentativeStatus: nullableCodeIdSchema,
  euRepresentativeName: nullableStringSchema,
  euRepresentativeAddress: nullableStringSchema,
  usesAutomatedDecisionMaking: nullableBooleanSchema,
  productionDataInDevelopment: nullableBooleanSchema,
  retentionPolicyExists: nullableBooleanSchema,
});

export const infrastructureProfileSchema = z.object({
  organizationProviders: z.array(providerSelectionSchema).default([]),
  mfaEnabled: nullableBooleanSchema,
  encryptedDevicesRequired: nullableBooleanSchema,
  backupsEnabled: nullableBooleanSchema,
  centralizedLoggingEnabled: nullableBooleanSchema,
  securityMonitoring: nullableCodeIdSchema,
  atRestAlgorithm: nullableCodeIdSchema,
  inTransitMinimumTlsVersion: nullableCodeIdSchema,
  keyManagementProvider: nullableCodeIdSchema,
  backupCadence: nullableCodeIdSchema,
  backupRetentionDays: nullableNumberSchema(z.number().int().min(0)),
  backupRetentionDaysStatus: nullableCodeIdSchema,
  restoreTestingCadence: nullableCodeIdSchema,
  vendorReviewRequired: nullableBooleanSchema,
  vendorReviewCadence: nullableCodeIdSchema,
  dpaRequiredForProcessors: nullableBooleanSchema,
  encryptionAtRest: nullableBooleanSchema,
  encryptionInTransit: nullableBooleanSchema,
});

export const securityProfileSchema = z.object({
  codeReviewRequired: nullableBooleanSchema,
  dependencySecurityMonitoring: nullableBooleanSchema,
  secretScanning: nullableBooleanSchema,
  automatedTestingBeforeDeployment: nullableBooleanSchema,
  cicdDeploymentProcess: nullableBooleanSchema,
  productionDeploymentApprovalRequired: nullableBooleanSchema,
  scanningCadence: nullableCodeIdSchema,
  penetrationTestingStrategy: nullableCodeIdSchema,
  penetrationTestingCadence: nullableCodeIdSchema,
  penetrationTestLastDate: nullableStringSchema,
  patchingSlaCriticalDays: nullableNumberSchema(z.number().int().min(0)),
  patchingSlaCriticalDaysStatus: nullableCodeIdSchema,
  patchingSlaHighDays: nullableNumberSchema(z.number().int().min(0)),
  patchingSlaHighDaysStatus: nullableCodeIdSchema,
  vulnerabilityDisclosureProgramExists: nullableBooleanSchema,
  vulnerabilityDisclosureUrl: nullableStringSchema,
  incidentResponsePlanExists: nullableBooleanSchema,
  incidentNotificationTimeline: nullableCodeIdSchema,
  customerNotificationProcess: nullableCodeIdSchema,
  incidentResponseLastTestedDate: nullableStringSchema,
});

export const dataHandlingProfileSchema = z.object({
  dataTypesStored: z.array(storedDataTypeSchema).default([]),
});

export const accessProfileSchema = z.object({
  mfaRequired: nullableBooleanSchema,
  ssoEnabled: nullableBooleanSchema,
  sharedAccountsExist: nullableBooleanSchema,
  offboardingProcessExists: nullableBooleanSchema,
  accessReviewsPerformed: nullableBooleanSchema,
  leastPrivilege: nullableBooleanSchema,
  roleBasedAccess: nullableBooleanSchema,
  accessReviewCadence: nullableCodeIdSchema,
  adminApprovalRequired: nullableBooleanSchema,
  passwordManagerRequired: nullableBooleanSchema,
  securityTrainingRequired: nullableBooleanSchema,
  confidentialityAgreementsRequired: nullableBooleanSchema,
});

export const organizationSecurityProfileSchema = z.object({
  id: z.string().min(1),
  company: companyProfileSchema,
  services: z.array(serviceProfileSchema).default([]),
  privacy: privacyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  security: securityProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const securityProgramSnapshotSchema = z.object({
  organization: organizationSecurityProfileSchema.nullable(),
  businessActivities: z.array(businessActivitySchema),
  organizationProviders: z.array(organizationProviderInventorySchema),
  serviceProviderUsage: z.array(serviceProviderUsageSchema),
});

export type StoredDataType = z.infer<typeof storedDataTypeSchema>;
export type BusinessActivityInput = z.infer<typeof businessActivityInputSchema>;
export type BusinessActivity = z.infer<typeof businessActivitySchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type ServicePrivacyProfile = z.infer<typeof servicePrivacyProfileSchema>;
export type ServiceProfileInput = z.infer<typeof serviceProfileInputSchema>;
export type ServiceProfile = z.infer<typeof serviceProfileSchema>;
export type PrivacyProfile = z.infer<typeof privacyProfileSchema>;
export type InfrastructureProfile = z.infer<typeof infrastructureProfileSchema>;
export type SecurityProfile = z.infer<typeof securityProfileSchema>;
export type DataHandlingProfile = z.infer<typeof dataHandlingProfileSchema>;
export type AccessProfile = z.infer<typeof accessProfileSchema>;
export type OrganizationSecurityProfile = z.infer<
  typeof organizationSecurityProfileSchema
>;
export type SecurityProgramSnapshot = z.infer<
  typeof securityProgramSnapshotSchema
>;

export const emptyCompanyProfile: CompanyProfile = {
  companyName: "",
  legalEntityName: null,
  website: null,
  contactEmail: null,
  securityContactEmail: null,
  privacyContactEmail: null,
  country: null,
  address: null,
  employeeCount: null,
  industries: null,
  regions: null,
  handlesPii: null,
  handlesSensitiveData: null,
  storesPii: null,
  storesHealthcareData: null,
  complianceGoals: null,
};

export const emptyServiceProfile: ServiceProfileInput = {
  sortOrder: 0,
  serviceName: null,
  serviceDescription: null,
  serviceUrl: null,
  businessActivityIds: [],
  userTypes: null,
  customerTypes: null,
  availabilityRegions: null,
  childrenDirected: null,
  minimumUserAge: null,
  privacy: {
    usesCookiesOrTrackingTechnologies: null,
    cookieTrackingCategories: null,
    cookieConsentMechanism: null,
    nonEssentialCookiesBlockedUntilConsent: null,
    cookieRejectAsEasyAsAccept: null,
    cookieConsentWithdrawalMethod: null,
    cookieConsentNoPretickedBoxes: null,
    doNotTrackResponse: null,
    globalPrivacyControlSupported: null,
    primaryHostingRegion: null,
  },
};

export const emptyPrivacyProfile: PrivacyProfile = {
  supportedRights: null,
  requestMethods: null,
  responseTimelineDaysStatus: null,
  responseTimelineDays: null,
  identityVerificationRequired: null,
  authorizedAgentSupported: null,
  appealProcessExists: null,
  organizationProviders: [],
  sendsMarketingEmails: null,
  marketingOptOutMethod: null,
  transactionalEmailsSent: null,
  crossBorderTransfers: null,
  transferMechanisms: null,
  sellsOrSharesData: null,
  doNotSellLink: null,
  dpoStatus: null,
  dpoName: null,
  dpoEmail: null,
  euRepresentativeStatus: null,
  euRepresentativeName: null,
  euRepresentativeAddress: null,
  usesAutomatedDecisionMaking: null,
  productionDataInDevelopment: null,
  retentionPolicyExists: null,
};

export const emptyInfrastructureProfile: InfrastructureProfile = {
  organizationProviders: [],
  mfaEnabled: null,
  encryptedDevicesRequired: null,
  backupsEnabled: null,
  centralizedLoggingEnabled: null,
  securityMonitoring: null,
  atRestAlgorithm: null,
  inTransitMinimumTlsVersion: null,
  keyManagementProvider: null,
  backupCadence: null,
  backupRetentionDays: null,
  backupRetentionDaysStatus: null,
  restoreTestingCadence: null,
  vendorReviewRequired: null,
  vendorReviewCadence: null,
  dpaRequiredForProcessors: null,
  encryptionAtRest: null,
  encryptionInTransit: null,
};

export const emptySecurityProfile: SecurityProfile = {
  codeReviewRequired: null,
  dependencySecurityMonitoring: null,
  secretScanning: null,
  automatedTestingBeforeDeployment: null,
  cicdDeploymentProcess: null,
  productionDeploymentApprovalRequired: null,
  scanningCadence: null,
  penetrationTestingStrategy: null,
  penetrationTestingCadence: null,
  penetrationTestLastDate: null,
  patchingSlaCriticalDays: null,
  patchingSlaCriticalDaysStatus: null,
  patchingSlaHighDays: null,
  patchingSlaHighDaysStatus: null,
  vulnerabilityDisclosureProgramExists: null,
  vulnerabilityDisclosureUrl: null,
  incidentResponsePlanExists: null,
  incidentNotificationTimeline: null,
  customerNotificationProcess: null,
  incidentResponseLastTestedDate: null,
};

export const emptyDataHandlingProfile: DataHandlingProfile = {
  dataTypesStored: [],
};

export const emptyAccessProfile: AccessProfile = {
  mfaRequired: null,
  ssoEnabled: null,
  sharedAccountsExist: null,
  offboardingProcessExists: null,
  accessReviewsPerformed: null,
  leastPrivilege: null,
  roleBasedAccess: null,
  accessReviewCadence: null,
  adminApprovalRequired: null,
  passwordManagerRequired: null,
  securityTrainingRequired: null,
  confidentialityAgreementsRequired: null,
};
