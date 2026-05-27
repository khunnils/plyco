import { z } from "zod";

export const dpaStatusSchema = z.enum([
  "not_started",
  "requested",
  "under_review",
  "signed",
  "not_required",
  "unavailable",
  "unknown",
]);

export const providerCriticalitySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const providerDataProcessingLevelSchema = z.enum([
  "none",
  "limited",
  "subprocessor",
]);

export const providerSystemTypeSchema = z.enum([
  "auth",
  "source_control",
  "cloud",
  "password_manager",
  "analytics",
  "advertising",
  "newsletter",
]);

export const codeIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/,
    "Code IDs must use lowercase letters, numbers, underscores, or hyphens",
  );

export const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}$/, "Country codes must use ISO alpha-2 format");

export const countrySchema = z.object({
  code: countryCodeSchema,
  name: z.string().trim().min(1),
  active: z.boolean(),
});

export const vocabularyCodeSchema = z.object({
  id: z.string().min(1),
  codeId: codeIdSchema,
  name: z.string().trim().min(1),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  isSystem: z.boolean(),
});

export const vocabularyCodeSetSchema = z.object({
  id: z.string().min(1),
  codeSetId: codeIdSchema,
  name: z.string().trim().min(1),
  description: z.string(),
  isSystem: z.boolean(),
  codes: z.array(vocabularyCodeSchema),
});

export const vocabularySchema = z.object({
  codeSets: z.array(vocabularyCodeSetSchema),
});

export const vocabularyCodeInputSchema = z.object({
  codeId: codeIdSchema,
  name: z.string().trim().min(1, "Code name is required"),
  active: z.boolean().default(true),
});

export const providerSelectionSchema = z.object({
  systemType: providerSystemTypeSchema,
  providerId: z.string().trim().min(1),
  name: z.string().trim().optional(),
});

const nullableStringSchema = z.string().trim().nullable().default(null);
const nullableCodeIdSchema = codeIdSchema
  .or(z.literal(""))
  .nullable()
  .default(null);
const nullableCountryCodeSchema = countryCodeSchema
  .or(z.literal(""))
  .nullable()
  .default(null);
const nullableBooleanSchema = z.boolean().nullable().default(null);
const nullableCodeIdArraySchema = z
  .array(codeIdSchema)
  .nullable()
  .default(null);
const nullableNumberSchema = (schema: z.ZodNumber) =>
  schema.nullable().default(null);

export const complianceFieldVisibility = {
  "businessActivity.legalBasis": ["gdpr"],
  "privacy.dpoStatus": ["gdpr"],
  "privacy.dpoName": ["gdpr"],
  "privacy.dpoEmail": ["gdpr"],
  "privacy.euRepresentativeStatus": ["gdpr"],
  "privacy.euRepresentativeName": ["gdpr"],
  "privacy.euRepresentativeAddress": ["gdpr"],
} as const;

export type ComplianceFieldKey = keyof typeof complianceFieldVisibility;

export const isComplianceFieldVisible = (
  fieldKey: ComplianceFieldKey | string,
  complianceGoals: string[] | null | undefined,
) => {
  const requiredGoals =
    complianceFieldVisibility[fieldKey as ComplianceFieldKey];

  return (
    !requiredGoals ||
    requiredGoals.some((goal) => complianceGoals?.includes(goal))
  );
};

export const storedDataTypeSchema = z.object({
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
  retentionPolicy: nullableCodeIdSchema,
  retentionDays: z.number().int().min(0).default(0),
});

export const businessActivitySchema = businessActivityInputSchema.extend({
  id: z.string().min(1),
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
  complianceGoals: nullableCodeIdArraySchema,
});

export const servicePrivacyProfileSchema = z.object({
  usesCookiesOrTrackingTechnologies: nullableBooleanSchema,
  cookieTrackingCategories: nullableCodeIdArraySchema,
  cookieConsentMechanism: nullableCodeIdSchema,
  doNotTrackResponse: nullableBooleanSchema,
  globalPrivacyControlSupported: nullableBooleanSchema,
  primaryHostingRegion: nullableCodeIdSchema,
});

export const serviceProfileInputSchema = z.object({
  id: z.string().min(1).optional(),
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
});

export const infrastructureProfileSchema = z.object({
  organizationProviders: z.array(providerSelectionSchema).default([]),
  mfaEnabled: nullableBooleanSchema,
  encryptedDevicesRequired: nullableBooleanSchema,
  backupsEnabled: nullableBooleanSchema,
  centralizedLoggingEnabled: nullableBooleanSchema,
  atRestAlgorithm: nullableCodeIdSchema,
  inTransitMinimumTlsVersion: nullableCodeIdSchema,
  keyManagementProvider: nullableCodeIdSchema,
  logRetentionDays: nullableNumberSchema(z.number().int().min(0)),
  logRetentionDaysStatus: nullableCodeIdSchema,
  securityMonitoringOwner: nullableCodeIdSchema,
  scanningCadence: nullableCodeIdSchema,
  patchingSlaCriticalDays: nullableNumberSchema(z.number().int().min(0)),
  patchingSlaCriticalDaysStatus: nullableCodeIdSchema,
  patchingSlaHighDays: nullableNumberSchema(z.number().int().min(0)),
  patchingSlaHighDaysStatus: nullableCodeIdSchema,
  incidentResponsePlanExists: nullableBooleanSchema,
  incidentNotificationTimeline: nullableCodeIdSchema,
  customerNotificationProcess: nullableCodeIdSchema,
  incidentResponseLastTestedDate: nullableStringSchema,
  backupCadence: nullableCodeIdSchema,
  backupRetentionDays: nullableNumberSchema(z.number().int().min(0)),
  backupRetentionDaysStatus: nullableCodeIdSchema,
  restoreTestingCadence: nullableCodeIdSchema,
  vendorReviewRequired: nullableBooleanSchema,
  vendorReviewCadence: nullableCodeIdSchema,
  dpaRequiredForProcessors: nullableBooleanSchema,
});

export const dataHandlingProfileSchema = z.object({
  dataTypesStored: z.array(storedDataTypeSchema).default([]),
  storesPii: nullableBooleanSchema,
  storesHealthcareData: nullableBooleanSchema,
  encryptionAtRest: nullableBooleanSchema,
  encryptionInTransit: nullableBooleanSchema,
  productionDataInDevelopment: nullableBooleanSchema,
  retentionPolicyExists: nullableBooleanSchema,
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
});

export const organizationProviderInputSchema = z.object({
  providerId: z.string().trim().optional().or(z.literal("")),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  name: z.string().trim().min(1, "Provider name is required"),
  legalName: z.string().trim().default(""),
  category: codeIdSchema.or(z.literal("")).default(""),
  countryOfRegistration: countryCodeSchema.or(z.literal("")).default(""),
  criticality: providerCriticalitySchema,
  notes: z.string().trim().optional().or(z.literal("")),
});

export const organizationProviderInventorySchema =
  organizationProviderInputSchema.extend({
    id: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

const serviceProviderUsageInputBaseSchema = z.object({
  serviceId: z.string().trim().min(1, "Service is required"),
  organizationProviderId: z.string().trim().min(1, "Provider is required"),
  systemType: providerSystemTypeSchema.nullable().default(null),
  purpose: z.string().trim().min(1, "Purpose is required"),
  dataProcessingLevel: providerDataProcessingLevelSchema.default("limited"),
  dataProcessed: z.array(z.string().trim().min(1)).default([]),
  dpaStatus: dpaStatusSchema,
  dataRegions: z.array(codeIdSchema).default([]),
  notes: z.string().trim().optional().or(z.literal("")),
});

const normalizeProviderDataProcessingNone = <
  T extends z.infer<typeof serviceProviderUsageInputBaseSchema>,
>(
  value: T,
): T =>
  value.dataProcessingLevel === "none"
    ? ({
        ...value,
        dataProcessed: [],
        dataRegions: [],
        dpaStatus: "not_required",
      } as T)
    : value;

export const serviceProviderUsageInputSchema =
  serviceProviderUsageInputBaseSchema.transform(
    normalizeProviderDataProcessingNone,
  );

const serviceProviderUsageStoredBaseSchema =
  serviceProviderUsageInputBaseSchema.extend({
    id: z.string().min(1),
    serviceName: z.string().trim().default(""),
    providerName: z.string().trim().default(""),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const serviceProviderUsageSchema =
  serviceProviderUsageStoredBaseSchema.transform(
    normalizeProviderDataProcessingNone,
  );

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  logoUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  category: z.string().trim().min(1).optional(),
  categoryCode: z.string().trim().optional(),
  legalName: z.string().trim().optional(),
  countryOfRegistration: z.string().trim().optional(),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  securityCriticality: z.string().trim().min(1).optional(),
  handlesCustomerData: z.boolean(),
});

export const providerLookupInputSchema = z.object({
  inputUrl: z.string().trim().url(),
});

export const providerLookupResultSchema = z
  .object({
    organization: z
      .object({
        id: z.string().trim(),
        name: z.string().trim(),
        legalName: z.string().trim(),
        countryOfRegistration: z.string().trim(),
        website: z.string().trim(),
      })
      .strict(),
    provider: z
      .object({
        id: z.string().trim(),
        name: z.string().trim(),
        organization: z.string().trim(),
        category: z.string().trim(),
        purpose: z.string().trim(),
        url: z.string().trim(),
        systemType: z.string().trim().nullable(),
        securityCriticality: z.string().trim(),
        handlesCustomerData: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const providerImportResultSchema = z
  .object({
    organizationRecordId: z.string().min(1),
    providerRecordId: z.string().min(1),
    organizationAction: z.enum(["created", "updated"]),
    providerAction: z.enum(["created", "updated"]),
    lookup: providerLookupResultSchema,
  })
  .strict();

export const templateSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Template slug must use lowercase letters, numbers, and hyphens",
  );

export const systemTemplateSchema = z.object({
  slug: templateSlugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content: z.string(),
});

export const templateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  slug: templateSlugSchema,
  sourceSystemTemplateSlug: templateSlugSchema.nullable(),
  content: z.string(),
  policyVersion: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  content: z.string(),
  policyVersion: z.string().default(""),
});

export const templatePreviewInputSchema = templateInputSchema;

export const templatePreviewSchema = z.object({
  renderedContent: z.string(),
});

type InternalTemplateVariableField = {
  key: string;
  label: string;
  type: string;
  category?: string;
  description?: string;
  example?: unknown;
  itemFields?: InternalTemplateVariableField[];
};

export const templateVariableFieldSchema: z.ZodType<InternalTemplateVariableField> =
  z.lazy(() =>
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1).default("unknown"),
      category: z.string().min(1).optional(),
      description: z.string().optional(),
      example: z.unknown().optional(),
      itemFields: z.array(templateVariableFieldSchema).optional(),
    }),
  );

export const templateVariableSchema = templateVariableFieldSchema.and(
  z.object({
    category: z.string().min(1),
  }),
);

export const templateVariableCatalogSchema = z.object({
  version: z.number().int().positive(),
  variables: z.array(templateVariableSchema),
});

export const createTemplateFromSystemSchema = z.object({
  sourceSystemTemplateSlug: templateSlugSchema,
});

export const documentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(1),
  renderedContent: z.string(),
  hasPdf: z.boolean(),
  sourceHash: z.string().min(1),
  generatedAt: z.string().datetime(),
});

export const documentStatusSchema = z.enum([
  "not_generated",
  "current",
  "stale",
]);

export const documentSummarySchema = z.object({
  template: templateSchema,
  document: documentSchema.nullable(),
  status: documentStatusSchema,
});

export const createDocumentSchema = z.object({
  templateId: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1),
  picture: z.string().url().optional(),
});

export const organizationMembershipRoleSchema = z.enum(["owner", "member"]);

export const organizationMemberSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().email(),
  role: organizationMembershipRoleSchema,
});

export const organizationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  role: organizationMembershipRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const authStateSchema = z.object({
  user: authUserSchema.nullable(),
  organizations: z.array(organizationSummarySchema).default([]),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export const templateCatalogSchema = z.object({
  systemTemplates: z.array(systemTemplateSchema),
  organizationTemplates: z.array(templateSchema),
});

export const organizationSecurityProfileSchema = z.object({
  id: z.string().min(1),
  company: companyProfileSchema,
  services: z.array(serviceProfileSchema).default([]),
  privacy: privacyProfileSchema,
  infrastructure: infrastructureProfileSchema,
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

export const structuredErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type DpaStatus = z.infer<typeof dpaStatusSchema>;
export type ProviderCriticality = z.infer<typeof providerCriticalitySchema>;
export type ProviderDataProcessingLevel = z.infer<
  typeof providerDataProcessingLevelSchema
>;
export type ProviderSystemType = z.infer<typeof providerSystemTypeSchema>;
export type CodeId = z.infer<typeof codeIdSchema>;
export type CountryCode = z.infer<typeof countryCodeSchema>;
export type Country = z.infer<typeof countrySchema>;
export type VocabularyCode = z.infer<typeof vocabularyCodeSchema>;
export type VocabularyCodeSet = z.infer<typeof vocabularyCodeSetSchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;
export type VocabularyCodeInput = z.infer<typeof vocabularyCodeInputSchema>;
export type ProviderSelection = z.infer<typeof providerSelectionSchema>;
export type StoredDataType = z.infer<typeof storedDataTypeSchema>;
export type BusinessActivityInput = z.infer<typeof businessActivityInputSchema>;
export type BusinessActivity = z.infer<typeof businessActivitySchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type ServicePrivacyProfile = z.infer<typeof servicePrivacyProfileSchema>;
export type ServiceProfileInput = z.infer<typeof serviceProfileInputSchema>;
export type ServiceProfile = z.infer<typeof serviceProfileSchema>;
export type PrivacyProfile = z.infer<typeof privacyProfileSchema>;
export type InfrastructureProfile = z.infer<typeof infrastructureProfileSchema>;
export type DataHandlingProfile = z.infer<typeof dataHandlingProfileSchema>;
export type AccessProfile = z.infer<typeof accessProfileSchema>;
export type OrganizationProviderInput = z.infer<
  typeof organizationProviderInputSchema
>;
export type OrganizationProvider = z.infer<
  typeof organizationProviderInventorySchema
>;
export type ServiceProviderUsageInput = z.infer<
  typeof serviceProviderUsageInputSchema
>;
export type ServiceProviderUsage = z.infer<typeof serviceProviderUsageSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type ProviderLookupInput = z.infer<typeof providerLookupInputSchema>;
export type ProviderLookupResult = z.infer<typeof providerLookupResultSchema>;
export type ProviderImportResult = z.infer<typeof providerImportResultSchema>;
export type SystemTemplate = z.infer<typeof systemTemplateSchema>;
export type Template = z.infer<typeof templateSchema>;
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type TemplatePreviewInput = z.infer<typeof templatePreviewInputSchema>;
export type TemplatePreview = z.infer<typeof templatePreviewSchema>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type TemplateVariableField = z.infer<typeof templateVariableFieldSchema>;
export type TemplateVariableCatalog = z.infer<
  typeof templateVariableCatalogSchema
>;
export type CreateTemplateFromSystem = z.infer<
  typeof createTemplateFromSystemSchema
>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type TemplateCatalog = z.infer<typeof templateCatalogSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type OrganizationMembershipRole = z.infer<
  typeof organizationMembershipRoleSchema
>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;
export type AuthState = z.infer<typeof authStateSchema>;
export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type OrganizationSecurityProfile = z.infer<
  typeof organizationSecurityProfileSchema
>;
export type SecurityProgramSnapshot = z.infer<
  typeof securityProgramSnapshotSchema
>;
export type StructuredError = z.infer<typeof structuredErrorSchema>;

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
  complianceGoals: null,
};

export const emptyServiceProfile: ServiceProfileInput = {
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
};

export const emptyInfrastructureProfile: InfrastructureProfile = {
  organizationProviders: [],
  mfaEnabled: null,
  encryptedDevicesRequired: null,
  backupsEnabled: null,
  centralizedLoggingEnabled: null,
  atRestAlgorithm: null,
  inTransitMinimumTlsVersion: null,
  keyManagementProvider: null,
  logRetentionDays: null,
  logRetentionDaysStatus: null,
  securityMonitoringOwner: null,
  scanningCadence: null,
  patchingSlaCriticalDays: null,
  patchingSlaCriticalDaysStatus: null,
  patchingSlaHighDays: null,
  patchingSlaHighDaysStatus: null,
  incidentResponsePlanExists: null,
  incidentNotificationTimeline: null,
  customerNotificationProcess: null,
  incidentResponseLastTestedDate: null,
  backupCadence: null,
  backupRetentionDays: null,
  backupRetentionDaysStatus: null,
  restoreTestingCadence: null,
  vendorReviewRequired: null,
  vendorReviewCadence: null,
  dpaRequiredForProcessors: null,
};

export const emptyDataHandlingProfile: DataHandlingProfile = {
  dataTypesStored: [],
  storesPii: null,
  storesHealthcareData: null,
  encryptionAtRest: null,
  encryptionInTransit: null,
  productionDataInDevelopment: null,
  retentionPolicyExists: null,
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
};
