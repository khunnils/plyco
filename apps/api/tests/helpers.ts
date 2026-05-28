import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js";
import { InMemoryDocumentRepository } from "../src/features/documents/in-memory-repository.js";
import { InMemoryOrganizationRepository } from "../src/features/organizations/in-memory-repository.js";
import { InMemoryVendorRepository } from "../src/features/vendors/in-memory-repository.js";

export const serviceBody = {
  serviceName: "Acme AI Platform",
  serviceDescription: "Cloud software for managing customer security reviews",
  serviceUrl: "https://app.acme.example",
  userTypes: ["workspace_admins", "end_users"],
  customerTypes: ["smb", "mid_market"],
  availabilityRegions: ["us", "eu"],
  childrenDirected: false,
  minimumUserAge: 13,
  privacy: {
    usesCookiesOrTrackingTechnologies: true,
    cookieTrackingCategories: ["necessary", "analytics"],
    cookieConsentMechanism: "cookie_banner",
    doNotTrackResponse: false,
    globalPrivacyControlSupported: true,
    primaryHostingRegion: "us",
  },
};

export const storedService = {
  id: "service-platform",
  ...serviceBody,
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
};

export const profileBody = {
  company: {
    companyName: "Acme AI",
    legalEntityName: "Acme AI, Inc.",
    website: "https://acme.example",
    contactEmail: "hello@acme.example",
    securityContactEmail: "security@acme.example",
    privacyContactEmail: "privacy@acme.example",
    country: "US",
    address: "123 Market Street, San Francisco, CA",
    employeeCount: 12,
    industries: ["artificial_intelligence", "technology_saas"],
    regions: ["us", "eu"],
    handlesPii: true,
    handlesSensitiveData: true,
    complianceGoals: ["soc_2", "gdpr"],
  },
  services: [serviceBody],
  privacy: {
    supportedRights: ["access", "deletion", "correction", "opt_out"],
    requestMethods: ["email", "web_form"],
    responseTimelineDaysStatus: "defined",
    responseTimelineDays: 30,
    identityVerificationRequired: true,
    authorizedAgentSupported: true,
    appealProcessExists: false,
    organizationProviders: [
      {
        systemType: "newsletter",
        providerId: "prov-mailchimp",
        name: "Mailchimp",
      },
    ],
    sendsMarketingEmails: true,
    marketingOptOutMethod: "unsubscribe_link",
    transactionalEmailsSent: true,
    crossBorderTransfers: true,
    transferMechanisms: ["sccs", "dpf"],
    sellsOrSharesData: false,
    doNotSellLink: "",
    dpoStatus: "not_appointed",
    dpoName: "",
    dpoEmail: "",
    euRepresentativeStatus: "not_appointed",
    euRepresentativeName: "",
    euRepresentativeAddress: "",
    usesAutomatedDecisionMaking: false,
  },
  infrastructure: {
    organizationProviders: [
      {
        systemType: "source_control",
        providerId: "prov-github",
      },
    ],
    mfaEnabled: true,
    encryptedDevicesRequired: true,
    backupsEnabled: true,
    centralizedLoggingEnabled: false,
    atRestAlgorithm: "aes_256",
    inTransitMinimumTlsVersion: "tls_1_2",
    keyManagementProvider: "aws_kms",
    logRetentionDays: 365,
    securityMonitoringOwner: "security",
    scanningCadence: "weekly",
    patchingSlaCriticalDays: 7,
    patchingSlaHighDays: 30,
    incidentResponsePlanExists: true,
    incidentNotificationTimeline: "within_72_hours",
    customerNotificationProcess: "email_notice",
    incidentResponseLastTestedDate: "2026-05-21",
    backupCadence: "daily",
    backupRetentionDays: 30,
    restoreTestingCadence: "quarterly",
    vendorReviewRequired: true,
    vendorReviewCadence: "annually",
    dpaRequiredForProcessors: true,
  },
  dataHandling: {
    dataTypesStored: [
      {
        name: "Customer account data",
        description: "Profile and billing contact details",
        subjectTypes: ["customer", "administrator"],
        collectionMethods: ["account_signup"],
        isSensitive: true,
        isRequired: true,
      },
      {
        name: "Usage data",
        description: "Usage events for product improvement",
        subjectTypes: ["end_user"],
        collectionMethods: ["product_usage"],
        isSensitive: false,
        isRequired: false,
      },
    ],
    storesPii: true,
    storesHealthcareData: false,
    encryptionAtRest: true,
    encryptionInTransit: true,
    productionDataInDevelopment: false,
    retentionPolicyExists: false,
  },
  access: {
    mfaRequired: true,
    ssoEnabled: false,
    sharedAccountsExist: false,
    offboardingProcessExists: true,
    accessReviewsPerformed: false,
    leastPrivilege: true,
    roleBasedAccess: true,
    accessReviewCadence: "quarterly",
    adminApprovalRequired: true,
    passwordManagerRequired: true,
  },
};

export const vendorBody = {
  providerId: "prov-github",
  systemTypes: [],
  name: "GitHub",
  legalName: "GitHub, Inc.",
  category: "source_control",
  countryOfRegistration: "US",
  criticality: "high",
  notes: "Critical engineering system",
};

export const vendorUseBody = {
  serviceId: "service-platform",
  organizationProviderId: "provider-limited",
  systemType: null,
  purpose: "Code hosting and pull requests",
  dataProcessingLevel: "limited",
  dataProcessed: ["Customer account data"],
  dpaStatus: "signed",
  dataRegions: ["us"],
  notes: "Critical engineering system",
};

export const subprocessorBody = {
  ...vendorBody,
  name: "Stripe",
  category: "payments",
  criticality: "medium",
  notes: "Customer payment processor",
};

export const subprocessorUseBody = {
  ...vendorUseBody,
  organizationProviderId: "provider-subprocessor",
  purpose: "Payment processing",
  dataProcessingLevel: "subprocessor",
  dataRegions: ["us", "eu"],
  notes: "Customer payment processor",
};

export const noProcessingVendorBody = {
  ...vendorBody,
  name: "Linear",
  category: "project_management",
  criticality: "low",
  notes: "",
};

export const noProcessingVendorUseBody = {
  ...vendorUseBody,
  organizationProviderId: "provider-none",
  purpose: "Issue tracking",
  dataProcessingLevel: "none",
  dataProcessed: [],
  dpaStatus: null,
  dataRegions: [],
  notes: "",
};

export const authConfig = {
  apiPublicUrl: "http://localhost:4000",
  clientUrl: "http://localhost:5173",
  googleClientId: "google-client-id",
  googleClientSecret: "google-client-secret",
  sessionKey: "test-session-key-with-at-least-32-chars",
  cookieSecure: false,
  cookieSameSite: "lax" as const,
};

export const providerLookupResult = {
  organization: {
    id: "",
    name: "GitHub",
    legalName: "GitHub, Inc.",
    countryOfRegistration: "US",
    website: "https://github.com",
  },
  provider: {
    id: "",
    name: "GitHub",
    organization: "",
    category: "source-control",
    purpose: "Source code hosting",
    url: "https://github.com",
    systemType: null,
    securityCriticality: "critical",
    handlesCustomerData: false,
  },
};

export function createInMemoryRepositories() {
  const accountRepository = new InMemoryAccountRepository();
  const organizationRepository = new InMemoryOrganizationRepository();

  return {
    accountRepository,
    documentRepository: new InMemoryDocumentRepository(organizationRepository),
    organizationRepository,
    vendorRepository: new InMemoryVendorRepository(organizationRepository),
  };
}
