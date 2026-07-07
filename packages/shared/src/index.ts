import { z } from "zod";

export const waitlistInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((email) => email.toLowerCase()),
  blocker: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => value || undefined),
  website: z.string().trim().max(500).optional().default(""),
});

export const waitlistResponseSchema = z.object({
  accepted: z.literal(true),
});

export const waitlistRemoveInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((email) => email.toLowerCase()),
});

export const waitlistRemoveResponseSchema = z.object({
  removed: z.literal(true),
});

export type WaitlistInput = z.infer<typeof waitlistInputSchema>;
export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;
export type WaitlistRemoveInput = z.infer<typeof waitlistRemoveInputSchema>;
export type WaitlistRemoveResponse = z.infer<typeof waitlistRemoveResponseSchema>;

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
  "not_set",
]);

export const providerSystemTypeSchema = z.enum([
  "ai",
  "auth",
  "source_control",
  "cloud",
  "password_manager",
  "analytics",
  "advertising",
  "issue_tracking",
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
  description: z.string().default(""),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  isSystem: z.boolean(),
});

export const vocabularyCodeSetSchema = z.object({
  id: z.string().min(1),
  codeSetId: codeIdSchema,
  name: z.string().trim().min(1),
  description: z.string(),
  usesHints: z.boolean().default(false),
  isSystem: z.boolean(),
  codes: z.array(vocabularyCodeSchema),
});

export const vocabularySchema = z.object({
  codeSets: z.array(vocabularyCodeSetSchema),
});

export const vocabularyCodeInputSchema = z.object({
  codeId: codeIdSchema,
  name: z.string().trim().min(1, "Code name is required"),
  description: z.string().default(""),
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
  "infrastructure.dpaRequiredForProcessors": ["gdpr"],
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

export const organizationProviderInputSchema = z.object({
  providerId: z.string().trim().optional().or(z.literal("")),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  name: z.string().trim().min(1, "Provider name is required"),
  legalName: z.string().trim().default(""),
  category: codeIdSchema.or(z.literal("")).default(""),
  countryOfRegistration: countryCodeSchema.or(z.literal("")).default(""),
  criticality: providerCriticalitySchema,
  notes: z.string().trim().optional().or(z.literal("")),
  purpose: z.string().trim().optional().or(z.literal("")),
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
  dpaStatus: dpaStatusSchema.nullable().default(null),
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
        dpaStatus: null,
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
  purpose: z.string().trim().optional(),
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

export const recommendationSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const recommendationSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  severity: recommendationSeveritySchema,
  frameworks: z.array(codeIdSchema).default([]),
  message: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
  relatedFields: z.array(z.string().trim().min(1)).default([]),
});

export const recommendationCountsBySeveritySchema = z.object({
  low: z.number().int().min(0).default(0),
  medium: z.number().int().min(0).default(0),
  high: z.number().int().min(0).default(0),
  critical: z.number().int().min(0).default(0),
});

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(recommendationSchema),
  countsBySeverity: recommendationCountsBySeveritySchema,
});

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
  versionMajor: z.number().int().default(1),
  versionMinor: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  content: z.string(),
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

export const documentSourceFingerprintSchema = z.object({
  version: z.literal(1),
  contentHash: z.string().min(1),
  entries: z.array(
    z.object({
      path: z.string().min(1),
      label: z.string().min(1),
      valueHash: z.string().min(1),
      summary: z.object({
        display: z.string(),
        names: z.array(z.string()).default([]),
      }),
    }),
  ),
});

export const documentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(1),
  renderedContent: z.string(),
  hasPdf: z.boolean(),
  sourceHash: z.string().min(1),
  sourceFingerprint: documentSourceFingerprintSchema,
  templateVersionMajor: z.number().int().default(1),
  templateVersionMinor: z.number().int().default(0),
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
  staleReasons: z.array(z.string().min(1)).default([]),
  documents: z.array(documentSchema).default([]),
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
  createdAt: z.string().datetime().optional(),
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

export const magicLinkRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email must be valid")
    .transform((email) => email.toLowerCase()),
  returnTo: z.string().trim().min(1).optional(),
});

export const magicLinkResponseSchema = z.object({
  sent: z.literal(true),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  website: z.string().trim().url().optional(),
});

export const organizationInvitationInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invite email must be valid")
    .transform((email) => email.toLowerCase()),
  role: organizationMembershipRoleSchema,
});

export const organizationInvitationSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: organizationMembershipRoleSchema,
  invitedByUserId: z.string().min(1),
  invitedByName: z.string().trim().min(1),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const organizationMemberRoleUpdateSchema = z.object({
  role: organizationMembershipRoleSchema,
});

export const acceptOrganizationInvitationSchema = z.object({
  organization: organizationSummarySchema,
});

export const deleteOrganizationResponseSchema = z.object({
  deleted: z.literal(true),
});

export const createOrganizationApiKeySchema = z.object({
  name: z.string().trim().min(1, "API key name is required").max(100),
});

export const organizationApiKeySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  keyPrefix: z.string().min(1),
  createdByUserId: z.string().min(1),
  createdByName: z.string().trim().min(1),
  createdAt: z.string().datetime(),
});

// The raw `key` is returned only once, at creation time; it is never persisted
// in plaintext and cannot be retrieved again.
export const createdOrganizationApiKeySchema = organizationApiKeySchema.extend({
  key: z.string().min(1),
});

export const organizationLookupInputSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  website: z.string().trim().url("Website must be a valid URL"),
});

export const organizationWebsiteLookupInputSchema = z.object({
  website: z.string().trim().url("Website must be a valid URL"),
});

export const organizationPrivacyPolicyLookupInputSchema = z.object({
  privacyPolicyUrl: z
    .string()
    .trim()
    .url("Privacy policy URL must be a valid URL"),
});

export const organizationLookupPolicyLinkSchema = z.object({
  type: z
    .enum([
      "privacy_policy",
      "data_security",
      "subprocessors",
      "terms",
      "other",
    ])
    .default("other"),
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
});

export const organizationLookupSuggestedProviderSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().trim().url().optional(),
  purpose: z.string().trim().optional(),
});

export const organizationLookupResultSchema = z.object({
  company: companyProfileSchema,
  primaryService: serviceProfileInputSchema,
  dataTypes: z.array(storedDataTypeSchema).default([]),
  activities: z.array(businessActivityInputSchema).default([]),
  suggestedProviders: z
    .array(organizationLookupSuggestedProviderSchema)
    .max(12)
    .default([]),
  policyLinks: z.array(organizationLookupPolicyLinkSchema).max(12).default([]),
  privacyPolicyUrl: z.string().trim().url().nullable().default(null),
  warnings: z.array(z.string().trim().min(1)).max(8).default([]),
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

export const reorderEntitiesSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
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
export type ReorderEntitiesInput = z.infer<typeof reorderEntitiesSchema>;
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
export type RecommendationSeverity = z.infer<
  typeof recommendationSeveritySchema
>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationCountsBySeverity = z.infer<
  typeof recommendationCountsBySeveritySchema
>;
export type RecommendationsResponse = z.infer<
  typeof recommendationsResponseSchema
>;
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
export type DocumentSourceFingerprint = z.infer<
  typeof documentSourceFingerprintSchema
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
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkResponse = z.infer<typeof magicLinkResponseSchema>;
export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type OrganizationInvitationInput = z.infer<
  typeof organizationInvitationInputSchema
>;
export type OrganizationInvitation = z.infer<
  typeof organizationInvitationSchema
>;
export type OrganizationMemberRoleUpdate = z.infer<
  typeof organizationMemberRoleUpdateSchema
>;
export type AcceptOrganizationInvitation = z.infer<
  typeof acceptOrganizationInvitationSchema
>;
export type DeleteOrganizationResponse = z.infer<
  typeof deleteOrganizationResponseSchema
>;
export type CreateOrganizationApiKey = z.infer<
  typeof createOrganizationApiKeySchema
>;
export type OrganizationApiKey = z.infer<typeof organizationApiKeySchema>;
export type CreatedOrganizationApiKey = z.infer<
  typeof createdOrganizationApiKeySchema
>;
export type OrganizationLookupInput = z.infer<
  typeof organizationLookupInputSchema
>;
export type OrganizationWebsiteLookupInput = z.infer<
  typeof organizationWebsiteLookupInputSchema
>;
export type OrganizationPrivacyPolicyLookupInput = z.infer<
  typeof organizationPrivacyPolicyLookupInputSchema
>;
export type OrganizationLookupPolicyLink = z.infer<
  typeof organizationLookupPolicyLinkSchema
>;
export type OrganizationLookupSuggestedProvider = z.infer<
  typeof organizationLookupSuggestedProviderSchema
>;
export type OrganizationLookupResult = z.infer<
  typeof organizationLookupResultSchema
>;
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
