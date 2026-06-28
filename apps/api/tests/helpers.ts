import { createApp } from "../src/app.js";
import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js";
import { InMemoryDocumentRepository } from "../src/features/documents/in-memory-repository.js";
import { InMemoryOrganizationRepository } from "../src/features/organizations/in-memory-repository.js";
import { InMemoryVendorRepository } from "../src/features/vendors/in-memory-repository.js";
import { InMemoryVocabularyRepository } from "../src/features/vocabulary/in-memory-repository.js";
import { NullDocumentPdfStorage } from "../src/infrastructure/document-pdfs.js";
import { StaticProviderSource } from "../src/infrastructure/providers.js";
import { StaticSystemTemplateSource } from "../src/infrastructure/system-templates.js";

import { testVocabularyCodeSets } from "./vocabulary-fixtures.js";

export function createTestApp() {
  const accountRepository = new InMemoryAccountRepository();
  const organizationRepository = new InMemoryOrganizationRepository();
  const vendorRepository = new InMemoryVendorRepository(organizationRepository);
  const vocabularyRepository = new InMemoryVocabularyRepository(
    testVocabularyCodeSets,
  );
  const documentRepository = new InMemoryDocumentRepository(
    organizationRepository,
  );

  return createApp({
    auth: false,
    accountRepository,
    documentRepository,
    documentPdfStorage: new NullDocumentPdfStorage(),
    organizationRepository,
    vendorRepository,
    vocabularyRepository,
    providerSource: new StaticProviderSource([
      {
        id: "prov-github",
        name: "GitHub",
        url: "https://github.com",
        category: "Source Control",
        systemTypes: ["source_control"],
        securityCriticality: "Critical",
        handlesCustomerData: false,
      },
      {
        id: "prov-google-analytics",
        name: "Google Analytics",
        url: "https://analytics.google.com",
        category: "Analytics",
        systemTypes: ["analytics"],
        securityCriticality: "Medium",
        handlesCustomerData: true,
      },
      {
        id: "prov-posthog",
        name: "PostHog",
        url: "https://posthog.com",
        category: "Analytics",
        systemTypes: ["analytics"],
        securityCriticality: "Medium",
        handlesCustomerData: true,
      },
      {
        id: "prov-google-ads",
        name: "Google Ads",
        url: "https://ads.google.com",
        category: "Advertising",
        systemTypes: ["advertising"],
        securityCriticality: "Medium",
        handlesCustomerData: true,
      },
      {
        id: "prov-mailchimp",
        name: "Mailchimp",
        url: "https://mailchimp.com",
        category: "Newsletter",
        systemTypes: ["newsletter"],
        securityCriticality: "Medium",
        handlesCustomerData: true,
      },
      {
        id: "prov-linear",
        name: "Linear",
        url: "https://linear.app",
        category: "Issue Tracking",
        systemTypes: ["issue_tracking"],
        securityCriticality: "Medium",
        handlesCustomerData: false,
        purpose: "Issue tracking",
      },
    ]),
    systemTemplateSource: new StaticSystemTemplateSource([
      {
        slug: "data-security-policy",
        name: "Data Security Policy",
        description:
          "A customer-facing security policy covering governance, secure development, access, protection, detection, response, recovery, and vendor risk.",
        content: "# {{ company.name }} Data Security Policy\n",
      },
      {
        slug: "incident-response-plan",
        name: "Incident Response Plan",
        description: "A lightweight incident response outline.",
        content: "# {{ company.name }} Incident Response Plan\n",
      },
      {
        slug: "subprocessors",
        name: "Subprocessors",
        description:
          "A customer-facing subprocessor summary based on the organization's vendor data processors.",
        content: "# {{ organization.name }} Data Processors and Subprocessors\n",
      },
      {
        slug: "privacy-policy",
        name: "Privacy Policy",
        description:
          "A customer-facing privacy policy based on the organization's privacy, service, and vendor data.",
        content: "# {{ company.name }} Privacy Policy\n",
      },
    ]),
  });
}

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
    nonEssentialCookiesBlockedUntilConsent: true,
    cookieRejectAsEasyAsAccept: true,
    cookieConsentWithdrawalMethod: "cookie_preferences",
    cookieConsentNoPretickedBoxes: true,
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
    storesPii: true,
    storesHealthcareData: false,
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
    productionDataInDevelopment: false,
    retentionPolicyExists: false,
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
    securityMonitoring: "automated",
    atRestAlgorithm: "aes_256",
    inTransitMinimumTlsVersion: "tls_1_2",
    keyManagementProvider: "aws_kms",
    backupCadence: "daily",
    backupRetentionDays: 30,
    restoreTestingCadence: "quarterly",
    vendorReviewRequired: true,
    vendorReviewCadence: "annually",
    dpaRequiredForProcessors: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
  },
  security: {
    codeReviewRequired: true,
    dependencySecurityMonitoring: true,
    secretScanning: true,
    automatedTestingBeforeDeployment: true,
    cicdDeploymentProcess: true,
    productionDeploymentApprovalRequired: true,
    scanningCadence: "weekly",
    penetrationTestingStrategy: "external",
    penetrationTestingCadence: "annually",
    penetrationTestLastDate: "2026-05-20",
    patchingSlaCriticalDays: 7,
    patchingSlaCriticalDaysStatus: "defined",
    patchingSlaHighDays: 30,
    patchingSlaHighDaysStatus: "defined",
    vulnerabilityDisclosureProgramExists: true,
    vulnerabilityDisclosureUrl: "https://acme.example/security",
    incidentResponsePlanExists: true,
    incidentNotificationTimeline: "within_72_hours",
    customerNotificationProcess: "email_notice",
    incidentResponseLastTestedDate: "2026-05-21",
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
  clientUrl: "http://localhost:4200",
  webUrl: "http://localhost:4300",
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
