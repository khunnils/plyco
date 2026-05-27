import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { type SecurityProgramSnapshot } from "@plyco/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp, createTestApp } from "../src/app.js";
import { readAuthConfig } from "../src/config.js";
import {
  Jinja2Renderer,
  ReportContextBuilder,
} from "../src/document-generation.js";
import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js";
import { InMemoryDocumentRepository } from "../src/features/documents/in-memory-repository.js";
import { InMemoryOrganizationRepository } from "../src/features/organizations/in-memory-repository.js";
import { InMemoryVendorRepository } from "../src/features/vendors/in-memory-repository.js";
import { InMemoryVocabularyRepository } from "../src/features/vocabulary/in-memory-repository.js";
import { LlmProviderLookupService } from "../src/provider-lookup.js";
import { AirtableProviderSource } from "../src/providers.js";
import { StaticProviderLookupCodeSource } from "../src/airtable-code-source.js";
import {
  AirtableProviderImportClient,
  AirtableProviderImportService,
} from "../src/provider-import.js";
import { parseSystemTemplate } from "../src/system-templates.js";

const serviceBody = {
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

const storedService = {
  id: "service-platform",
  ...serviceBody,
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
};

const profileBody = {
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

const vendorBody = {
  providerId: "prov-github",
  systemTypes: [],
  name: "GitHub",
  legalName: "GitHub, Inc.",
  category: "source_control",
  countryOfRegistration: "US",
  criticality: "high",
  notes: "Critical engineering system",
};

const vendorUseBody = {
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

const subprocessorBody = {
  ...vendorBody,
  name: "Stripe",
  category: "payments",
  criticality: "medium",
  notes: "Customer payment processor",
};

const subprocessorUseBody = {
  ...vendorUseBody,
  organizationProviderId: "provider-subprocessor",
  purpose: "Payment processing",
  dataProcessingLevel: "subprocessor",
  dataRegions: ["us", "eu"],
  notes: "Customer payment processor",
};

const noProcessingVendorBody = {
  ...vendorBody,
  name: "Linear",
  category: "project_management",
  criticality: "low",
  notes: "",
};

const noProcessingVendorUseBody = {
  ...vendorUseBody,
  organizationProviderId: "provider-none",
  purpose: "Issue tracking",
  dataProcessingLevel: "none",
  dataProcessed: [],
  dpaStatus: "not_required",
  dataRegions: [],
  notes: "",
};

const authConfig = {
  apiPublicUrl: "http://localhost:4000",
  clientUrl: "http://localhost:5173",
  googleClientId: "google-client-id",
  googleClientSecret: "google-client-secret",
  sessionKey: "test-session-key-with-at-least-32-chars",
  cookieSecure: false,
  cookieSameSite: "lax" as const,
};

const providerLookupResult = {
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
    category: "source_control",
    purpose: "Source code hosting",
    categoryName: "Source control",
    url: "https://github.com",
    systemType: "source_control",
    securityCriticality: "critical",
    handlesCustomerData: false,
  },
};

describe("security profile API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns health status", async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("rejects protected routes when authentication is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  });

  it("returns anonymous auth state before login", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({ method: "GET", url: "/auth/me" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: null, organizations: [] });
  });

  it("supports idempotent logout without a session", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({ method: "POST", url: "/auth/logout" });

    expect(response.statusCode).toBe(204);
  });

  it("clears stale authenticated sessions whose user no longer exists", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });

    const staleCookieResponse = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: {
        cf_session: "Fe26.2**stale-session-cookie-placeholder**placeholder",
      },
    });

    expect(staleCookieResponse.statusCode).toBe(200);
  });

  it("requires auth config values when auth config is read", () => {
    expect(() => readAuthConfig({} as NodeJS.ProcessEnv)).toThrow(
      "SESSION_KEY is required",
    );
  });

  it("requires a high entropy session key", () => {
    expect(() =>
      readAuthConfig({
        SESSION_KEY: "short",
        API_PUBLIC_URL: "http://localhost:4000",
        CLIENT_URL: "http://localhost:5173",
        GOOGLE_OAUTH_CLIENT_ID: "client",
        GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      } as NodeJS.ProcessEnv),
    ).toThrow("SESSION_KEY must be at least 32 characters");
  });

  it("creates and returns organization security profile services", async () => {
    const app = await createTestApp();
    const saveResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json().organization.company.companyName).toBe(
      "Acme AI",
    );
    expect(saveResponse.json().organization.company.legalEntityName).toBe(
      "Acme AI, Inc.",
    );
    expect(
      saveResponse.json().organization.dataHandling.dataTypesStored,
    ).toEqual(profileBody.dataHandling.dataTypesStored);
    expect(saveResponse.json().organization.services).toEqual([
      expect.objectContaining(profileBody.services[0]),
    ]);
    expect(saveResponse.json().organization.privacy).toEqual(
      profileBody.privacy,
    );

    const getResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().organization.company.companyName).toBe("Acme AI");
    expect(
      getResponse.json().organization.dataHandling.dataTypesStored,
    ).toEqual(profileBody.dataHandling.dataTypesStored);
    expect(getResponse.json().organization.services).toEqual([
      expect.objectContaining(profileBody.services[0]),
    ]);
    expect(getResponse.json().organization.privacy).toEqual(
      profileBody.privacy,
    );
  });

  it("persists explicit empty, false, and zero profile answers", async () => {
    const explicitEmptyProfile = {
      ...profileBody,
      company: {
        ...profileBody.company,
        industries: [],
        handlesPii: false,
        employeeCount: 1,
        complianceGoals: [],
      },
      services: [
        {
          ...profileBody.services[0],
          userTypes: [],
          childrenDirected: false,
          minimumUserAge: 0,
          privacy: {
            ...profileBody.services[0].privacy,
            usesCookiesOrTrackingTechnologies: false,
            cookieTrackingCategories: [],
            cookieConsentMechanism: "",
          },
        },
      ],
      privacy: {
        ...profileBody.privacy,
        supportedRights: [],
        responseTimelineDaysStatus: "defined",
        responseTimelineDays: 0,
        identityVerificationRequired: false,
        transferMechanisms: [],
      },
    };
    const app = await createTestApp();
    const saveResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: explicitEmptyProfile,
    });

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json().organization.company.industries).toEqual([]);
    expect(saveResponse.json().organization.company.handlesPii).toBe(false);
    expect(saveResponse.json().organization.services[0].userTypes).toEqual([]);
    expect(saveResponse.json().organization.services[0].minimumUserAge).toBe(0);
    expect(saveResponse.json().organization.privacy.supportedRights).toEqual(
      [],
    );
    expect(saveResponse.json().organization.privacy.responseTimelineDays).toBe(
      0,
    );
    expect(
      saveResponse.json().organization.privacy.identityVerificationRequired,
    ).toBe(false);
  });

  it("rejects service profile codes that are not in organization vocabulary", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...profileBody.services[0],
            userTypes: ["not_a_real_user_type"],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "service_user_types",
          field: "services.0.userTypes",
          value: "not_a_real_user_type",
        },
      },
    });
  });

  it("supports multiple services and service-scoped vendor inventory", async () => {
    const app = await createTestApp();
    const saveResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          profileBody.services[0],
          {
            ...profileBody.services[0],
            serviceName: "Acme EU",
            serviceUrl: "https://eu.acme.example",
            availabilityRegions: ["eu"],
          },
        ],
      },
    });

    expect(saveResponse.statusCode).toBe(200);
    const services = saveResponse.json().organization.services;
    expect(services).toHaveLength(2);

    const vendorResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/organization-providers",
      payload: {
        ...vendorBody,
        name: "Stripe EU",
      },
    });

    expect(vendorResponse.statusCode).toBe(201);
    const vendorUseResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/service-provider-usage",
      payload: {
        ...vendorUseBody,
        serviceId: services[1].id,
        organizationProviderId: vendorResponse.json().id,
      },
    });

    expect(vendorUseResponse.statusCode).toBe(201);
    expect(vendorUseResponse.json()).toMatchObject({
      serviceId: services[1].id,
      serviceName: "Acme EU",
      providerName: "Stripe EU",
    });
    expect(vendorResponse.json()).toMatchObject({
      name: "Stripe EU",
    });

    const invalidVendorResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/service-provider-usage",
      payload: {
        ...vendorUseBody,
        organizationProviderId: vendorResponse.json().id,
        serviceId: "service_missing",
      },
    });

    expect(invalidVendorResponse.statusCode).toBe(400);
    expect(invalidVendorResponse.json().error.code).toBe(
      "PROVIDER_SERVICE_NOT_FOUND",
    );
  });

  it("rejects privacy profile codes that are not in organization vocabulary", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          supportedRights: ["not_a_real_right"],
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "privacy_supported_rights",
          field: "privacy.supportedRights",
          value: "not_a_real_right",
        },
      },
    });
  });

  it("rejects service cookie tracking codes that are not in organization vocabulary", async () => {
    const app = await createTestApp();
    const invalidCookieTypeResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              cookieTrackingCategories: ["not_a_real_cookie_type"],
            },
          },
        ],
      },
    });

    expect(invalidCookieTypeResponse.statusCode).toBe(400);
    expect(invalidCookieTypeResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "cookie_tracking_categories",
          field: "services.0.privacy.cookieTrackingCategories",
          value: "not_a_real_cookie_type",
        },
      },
    });

    const invalidConsentResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              cookieConsentMechanism: "not_a_real_mechanism",
            },
          },
        ],
      },
    });

    expect(invalidConsentResponse.statusCode).toBe(400);
    expect(invalidConsentResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "privacy_cookie_consent_mechanisms",
          field: "services.0.privacy.cookieConsentMechanism",
          value: "not_a_real_mechanism",
        },
      },
    });
  });

  it("rejects infrastructure providers that are not available for the selected system type", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          organizationProviders: [
            {
              systemType: "source_control",
              providerId: "prov-google-ads",
            },
          ],
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "PROVIDER_NOT_AVAILABLE_FOR_SYSTEM",
        details: {
          providerId: "prov-google-ads",
          systemType: "source_control",
        },
      },
    });
  });

  it("supports saving multiple 'none' infrastructure providers", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          organizationProviders: [
            {
              systemType: "cloud",
              providerId: "none",
            },
            {
              systemType: "source_control",
              providerId: "none",
            },
            {
              systemType: "password_manager",
              providerId: "none",
            },
          ],
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().organization.infrastructure.organizationProviders,
    ).toEqual(
      expect.arrayContaining([
        {
          systemType: "cloud",
          providerId: "none",
          name: "None",
        },
        {
          systemType: "source_control",
          providerId: "none",
          name: "None",
        },
        {
          systemType: "password_manager",
          providerId: "none",
          name: "None",
        },
      ]),
    );
  });

  it("rejects invalid marketing opt-out method codes", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          marketingOptOutMethod: "phone_call",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "privacy_marketing_opt_out_methods",
          field: "privacy.marketingOptOutMethod",
          value: "phone_call",
        },
      },
    });
  });

  it("rejects invalid international transfer codes", async () => {
    const app = await createTestApp();
    const invalidTransferResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          transferMechanisms: ["not_a_real_mechanism"],
        },
      },
    });

    expect(invalidTransferResponse.statusCode).toBe(400);
    expect(invalidTransferResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "privacy_transfer_mechanisms",
          field: "privacy.transferMechanisms",
          value: "not_a_real_mechanism",
        },
      },
    });

    const invalidRegionResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              primaryHostingRegion: "antarctica",
            },
          },
        ],
      },
    });

    expect(invalidRegionResponse.statusCode).toBe(400);
    expect(invalidRegionResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "regions",
          field: "services.0.privacy.primaryHostingRegion",
          value: "antarctica",
        },
      },
    });

    const invalidHostingRegionResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              primaryHostingRegion: "antarctica",
            },
          },
        ],
      },
    });

    expect(invalidHostingRegionResponse.statusCode).toBe(400);
    expect(invalidHostingRegionResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "regions",
          field: "services.0.privacy.primaryHostingRegion",
          value: "antarctica",
        },
      },
    });
  });

  it("rejects invalid security control codes", async () => {
    const app = await createTestApp();
    const invalidAccessResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        access: {
          ...profileBody.access,
          accessReviewCadence: "every_quarter",
        },
      },
    });

    expect(invalidAccessResponse.statusCode).toBe(400);
    expect(invalidAccessResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "security_cadences",
          field: "access.accessReviewCadence",
          value: "every_quarter",
        },
      },
    });

    const invalidInfrastructureResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          atRestAlgorithm: "aes_512",
        },
      },
    });

    expect(invalidInfrastructureResponse.statusCode).toBe(400);
    expect(invalidInfrastructureResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "security_encryption_algorithms",
          field: "infrastructure.atRestAlgorithm",
          value: "aes_512",
        },
      },
    });
  });

  it("builds report context with organization aliases and vendor collections", () => {
    const snapshot: SecurityProgramSnapshot = {
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [
        {
          id: "vendor-limited",
          ...vendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-subprocessor",
          ...subprocessorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-none",
          ...noProcessingVendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      serviceVendorUses: [
        {
          id: "vendor-use-limited",
          ...vendorUseBody,
          vendorName: "GitHub",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-subprocessor",
          ...subprocessorUseBody,
          vendorName: "Stripe",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-none",
          ...noProcessingVendorUseBody,
          vendorName: "Linear",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
    };

    const context = new ReportContextBuilder().build(snapshot);

    expect(context.organization.name).toBe("Acme AI");
    expect(context.organization.employeeCount).toBe(12);
    expect(context.company.name).toBe("Acme AI");
    expect(context.vendors.all.map((vendor) => vendor.name)).toEqual([
      "GitHub",
      "Stripe",
      "Linear",
    ]);
    expect(context.vendors.dataProcessors.map((vendor) => vendor.name)).toEqual(
      ["GitHub", "Stripe"],
    );
    expect(context.vendors.subprocessors.map((vendor) => vendor.name)).toEqual([
      "Stripe",
    ]);
    expect(context.vendors.byService).toEqual([
      expect.objectContaining({
        serviceId: "service-platform",
        serviceName: "Acme AI Platform",
        vendors: expect.arrayContaining([
          expect.objectContaining({ name: "GitHub" }),
          expect.objectContaining({ name: "Stripe" }),
        ]),
      }),
    ]);
    expect(context.services.all[0]).toMatchObject({
      vendors: expect.arrayContaining([
        expect.objectContaining({ name: "GitHub" }),
        expect.objectContaining({ name: "Stripe" }),
      ]),
      subprocessors: [expect.objectContaining({ name: "Stripe" })],
      dataTypes: [expect.objectContaining({ name: "Customer account data" })],
    });
  });

  it("adds answered and hasValue helper flags to report context fields", () => {
    const context = new ReportContextBuilder().build({
      organization: {
        id: "org-test",
        ...profileBody,
        company: {
          ...profileBody.company,
          industries: [],
          handlesPii: false,
        },
        services: [
          {
            ...storedService,
            userTypes: null,
            minimumUserAge: 0,
            privacy: {
              ...storedService.privacy,
              cookieTrackingCategories: [],
              usesCookiesOrTrackingTechnologies: false,
            },
          },
        ],
        privacy: {
          ...profileBody.privacy,
          supportedRights: null,
          requestMethods: [],
          identityVerificationRequired: false,
        },
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      organizationProviders: [],
      serviceProviderUsage: [],
    });

    expect(context.privacy.supportedRightsAnswered).toBe(false);
    expect(context.privacy.requestMethodsAnswered).toBe(true);
    expect(context.privacy.requestMethodsHasValue).toBe(false);
    expect(context.privacy.identityVerificationRequiredAnswered).toBe(true);
    expect(context.privacy.identityVerificationRequiredHasValue).toBe(false);
    expect(context.service.userTypesAnswered).toBe(false);
    expect(context.service.minimumUserAgeAnswered).toBe(true);
    expect(context.service.minimumUserAgeHasValue).toBe(false);
    expect(context.service.privacy.cookieTrackingCategoriesAnswered).toBe(true);
    expect(context.service.privacy.cookieTrackingCategoriesHasValue).toBe(
      false,
    );
    expect(context.vendors.dataProcessorsHasValue).toBe(false);
  });

  it("loads the report builder variable schema", async () => {
    const schemaPath = fileURLToPath(
      new URL("../data/templates/schema.json", import.meta.url),
    );
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));

    expect(schema.version).toBe(1);
    expect(schema.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "organization.name" }),
        expect.objectContaining({ key: "policy.version" }),
        expect.objectContaining({ key: "service.name" }),
        expect.objectContaining({ key: "service.description" }),
        expect.objectContaining({ key: "service.url" }),
        expect.objectContaining({ key: "service.userTypes" }),
        expect.objectContaining({ key: "service.userTypeLabels" }),
        expect.objectContaining({ key: "service.customerTypes" }),
        expect.objectContaining({ key: "service.customerTypeLabels" }),
        expect.objectContaining({ key: "service.availabilityRegions" }),
        expect.objectContaining({ key: "service.availabilityRegionLabels" }),
        expect.objectContaining({ key: "service.childrenDirected" }),
        expect.objectContaining({ key: "service.minimumUserAge" }),
        expect.objectContaining({
          key: "service.privacy.usesCookiesOrTrackingTechnologies",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieTrackingCategories",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieTrackingCategoryLabels",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieConsentMechanism",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieConsentMechanismLabel",
        }),
        expect.objectContaining({ key: "service.privacy.doNotTrackResponse" }),
        expect.objectContaining({
          key: "service.privacy.globalPrivacyControlSupported",
        }),
        expect.objectContaining({ key: "services.all" }),
        expect.objectContaining({ key: "services.primary" }),
        expect.objectContaining({ key: "privacy.supportedRights" }),
        expect.objectContaining({ key: "privacy.supportedRightLabels" }),
        expect.objectContaining({ key: "privacy.requestMethods" }),
        expect.objectContaining({ key: "privacy.requestMethodLabels" }),
        expect.objectContaining({ key: "privacy.responseTimelineDaysStatus" }),
        expect.objectContaining({
          key: "privacy.responseTimelineDaysStatusLabel",
        }),
        expect.objectContaining({ key: "privacy.responseTimelineDays" }),
        expect.objectContaining({
          key: "privacy.identityVerificationRequired",
        }),
        expect.objectContaining({ key: "privacy.authorizedAgentSupported" }),
        expect.objectContaining({ key: "privacy.appealProcessExists" }),
        expect.objectContaining({ key: "privacy.sendsMarketingEmails" }),
        expect.objectContaining({ key: "privacy.marketingOptOutMethod" }),
        expect.objectContaining({ key: "privacy.marketingOptOutMethodLabel" }),
        expect.objectContaining({ key: "privacy.transactionalEmailsSent" }),
        expect.objectContaining({ key: "privacy.crossBorderTransfers" }),
        expect.objectContaining({ key: "privacy.transferMechanisms" }),
        expect.objectContaining({ key: "privacy.transferMechanismLabels" }),
        expect.objectContaining({ key: "privacy.newsletterProvider" }),
        expect.objectContaining({ key: "privacy.newsletterProviderId" }),
        expect.objectContaining({
          key: "security.accessControl.leastPrivilege",
        }),
        expect.objectContaining({
          key: "security.authentication.mfaRequired",
        }),
        expect.objectContaining({
          key: "security.encryption.atRestAlgorithmLabel",
        }),
        expect.objectContaining({ key: "security.logging.logRetentionDays" }),
        expect.objectContaining({
          key: "security.vulnerabilityManagement.scanningCadenceLabel",
        }),
        expect.objectContaining({
          key: "security.incidentResponse.notificationTimelineLabel",
        }),
        expect.objectContaining({ key: "security.backups.backupCadenceLabel" }),
        expect.objectContaining({
          key: "security.vendorRisk.vendorReviewCadenceLabel",
        }),
        expect.objectContaining({ key: "vendors.all" }),
        expect.objectContaining({ key: "vendors.dataProcessors" }),
        expect.objectContaining({ key: "vendors.subprocessors" }),
        expect.objectContaining({ key: "vendors.byService" }),
      ]),
    );
  });

  it("exposes profile values and resolved labels in the document context", async () => {
    const vocabularyRepository = new InMemoryVocabularyRepository();
    const vocabulary = await vocabularyRepository.listVocabulary("org-test");
    const snapshot: SecurityProgramSnapshot = {
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [],
      serviceVendorUses: [],
    };

    const context = new ReportContextBuilder().build(
      snapshot,
      undefined,
      [],
      vocabulary,
    );

    expect(context.service).toMatchObject({
      id: "service-platform",
      name: "Acme AI Platform",
      description: "Cloud software for managing customer security reviews",
      url: "https://app.acme.example",
      userTypes: ["workspace_admins", "end_users"],
      userTypeLabels: ["Workspace admins", "End users"],
      customerTypes: ["smb", "mid_market"],
      customerTypeLabels: ["SMB", "Mid-market"],
      availabilityRegions: ["us", "eu"],
      availabilityRegionLabels: ["United States", "European Union"],
      childrenDirected: false,
      minimumUserAge: 13,
      privacy: {
        usesCookiesOrTrackingTechnologies: true,
        cookieTrackingCategories: ["necessary", "analytics"],
        cookieTrackingCategoryLabels: ["Necessary", "Analytics"],
        cookieConsentMechanism: "cookie_banner",
        cookieConsentMechanismLabel: "Cookie banner",
        doNotTrackResponse: false,
        globalPrivacyControlSupported: true,
        analyticsProviders: [],
        analyticsProviderIds: [],
        advertisingProviders: [],
        advertisingProviderIds: [],
        primaryHostingRegion: "us",
        primaryHostingRegionLabel: "United States",
      },
    });
    expect(context.services.primary).toMatchObject(context.service);
    expect(context.services.all).toHaveLength(1);
    expect(context.privacy).toMatchObject({
      supportedRights: ["access", "deletion", "correction", "opt_out"],
      supportedRightLabels: ["Access", "Deletion", "Correction", "Opt-out"],
      requestMethods: ["email", "web_form"],
      requestMethodLabels: ["Email", "Web form"],
      responseTimelineDaysStatus: "defined",
      responseTimelineDaysStatusLabel: "Defined",
      responseTimelineDays: 30,
      identityVerificationRequired: true,
      authorizedAgentSupported: true,
      appealProcessExists: false,
      sendsMarketingEmails: true,
      marketingOptOutMethod: "unsubscribe_link",
      marketingOptOutMethodLabel: "Unsubscribe link",
      transactionalEmailsSent: true,
      crossBorderTransfers: true,
      transferMechanisms: ["sccs", "dpf"],
      transferMechanismLabels: ["SCCs", "Data Privacy Framework"],
      newsletterProvider: "Mailchimp",
      newsletterProviderId: "prov-mailchimp",
    });
    expect(context.security).toMatchObject({
      accessControl: {
        leastPrivilege: true,
        roleBasedAccess: true,
        accessReviewCadence: "quarterly",
        accessReviewCadenceLabel: "Quarterly",
        adminApprovalRequired: true,
      },
      authentication: {
        mfaRequired: true,
        ssoSupported: false,
        passwordManagerRequired: true,
      },
      encryption: {
        atRestAlgorithm: "aes_256",
        atRestAlgorithmLabel: "AES-256",
        inTransitMinimumTlsVersion: "tls_1_2",
        inTransitMinimumTlsVersionLabel: "TLS 1.2",
        keyManagementProvider: "aws_kms",
        keyManagementProviderLabel: "AWS KMS",
      },
      logging: {
        centralizedLogging: false,
        logRetentionDays: 365,
        securityMonitoringOwner: "security",
        securityMonitoringOwnerLabel: "Security",
      },
      vulnerabilityManagement: {
        scanningCadence: "weekly",
        scanningCadenceLabel: "Weekly",
        patchingSlaCriticalDays: 7,
        patchingSlaHighDays: 30,
      },
      incidentResponse: {
        planExists: true,
        notificationTimeline: "within_72_hours",
        notificationTimelineLabel: "Within 72 hours",
        customerNotificationProcess: "email_notice",
        customerNotificationProcessLabel: "Email notice",
        lastTestedDate: "2026-05-21",
      },
      backups: {
        backupCadence: "daily",
        backupCadenceLabel: "Daily",
        backupRetentionDays: 30,
        restoreTestingCadence: "quarterly",
        restoreTestingCadenceLabel: "Quarterly",
      },
      vendorRisk: {
        vendorReviewRequired: true,
        vendorReviewCadence: "annually",
        vendorReviewCadenceLabel: "Annually",
        dpaRequiredForProcessors: true,
      },
    });
  });

  it("renders the subprocessors system template with data processors", async () => {
    const templatePath = fileURLToPath(
      new URL("../data/templates/subprocessors.md", import.meta.url),
    );
    const systemTemplate = parseSystemTemplate(
      await readFile(templatePath, "utf8"),
      "subprocessors.md",
    );
    const context = new ReportContextBuilder().build({
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [
        {
          id: "vendor-limited",
          ...vendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-subprocessor",
          ...subprocessorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      serviceVendorUses: [
        {
          id: "vendor-use-limited",
          ...vendorUseBody,
          vendorName: "GitHub",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-subprocessor",
          ...subprocessorUseBody,
          vendorName: "Stripe",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
    });
    const renderedContent = new Jinja2Renderer().render(
      {
        id: "template-subprocessors",
        organizationId: "org-test",
        sourceSystemTemplateSlug: systemTemplate.slug,
        policyVersion: "",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
        ...systemTemplate,
      },
      context,
    );

    expect(renderedContent).toContain("# Acme AI Data Processors");
    expect(renderedContent).toContain("| GitHub | limited |");
    expect(renderedContent).toContain("| Stripe | subprocessor |");
    expect(renderedContent).toContain(
      "| Stripe |  | Acme AI Platform | Payment processing |",
    );
  });

  it("returns structured validation errors", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        company: { ...profileBody.company, companyName: "" },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_FAILED");
  });

  it("supports vendor CRUD", async () => {
    const app = await createTestApp();
    const profileResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const serviceId = profileResponse.json().organization.services[0].id;

    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/organization-providers",
      payload: vendorBody,
    });

    expect(createResponse.statusCode).toBe(201);
    const createdVendor = createResponse.json();
    expect(createdVendor.name).toBe("GitHub");
    expect(createdVendor.countryOfRegistration).toBe("US");

    const createUseResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/service-provider-usage",
      payload: {
        ...vendorUseBody,
        serviceId,
        organizationProviderId: createdVendor.id,
      },
    });

    expect(createUseResponse.statusCode).toBe(201);
    const createdProviderUsage = createUseResponse.json();
    expect(createdProviderUsage.dpaStatus).toBe("signed");

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/service-provider-usage/${createdProviderUsage.id}`,
      payload: {
        ...vendorUseBody,
        serviceId,
        organizationProviderId: createdVendor.id,
        dpaStatus: "under_review",
        notes: "DPA being reviewed",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().dpaStatus).toBe("under_review");

    const listResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/organization-providers",
    });
    expect(listResponse.json()).toHaveLength(1);
    const useListResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/service-provider-usage",
    });
    expect(useListResponse.json()).toHaveLength(1);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/organizations/org-test/organization-providers/${createdVendor.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const emptyListResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/organization-providers",
    });
    expect(emptyListResponse.json()).toHaveLength(0);
  });

  it("returns countries and organization vocabulary", async () => {
    const app = await createTestApp();
    const countriesResponse = await app.inject({
      method: "GET",
      url: "/countries",
    });

    expect(countriesResponse.statusCode).toBe(200);
    expect(countriesResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "US",
          name: "United States of America",
        }),
      ]),
    );

    const vocabularyResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });

    expect(vocabularyResponse.statusCode).toBe(200);
    expect(vocabularyResponse.json().codeSets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          codeSetId: "industries",
          isSystem: false,
        }),
        expect.objectContaining({
          codeSetId: "dpa_status",
          isSystem: true,
        }),
      ]),
    );
  });

  it("supports editing organization vocabulary codes", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vocabulary/industries/codes",
      payload: {
        codeId: "robotics",
        name: "Robotics",
        active: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      codeId: "robotics",
      name: "Robotics",
      isSystem: false,
    });

    const updateResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/vocabulary/industries/codes/robotics",
      payload: {
        codeId: "robotics",
        name: "Robotics and automation",
        active: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().name).toBe("Robotics and automation");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/organizations/org-test/vocabulary/industries/codes/robotics",
    });

    expect(deleteResponse.statusCode).toBe(204);

    const deleteSystemDerivedResponse = await app.inject({
      method: "DELETE",
      url: "/organizations/org-test/vocabulary/industries/codes/edtech",
    });

    expect(deleteSystemDerivedResponse.statusCode).toBe(204);

    const vocabularyAfterDeleteResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });
    const industriesAfterDelete = vocabularyAfterDeleteResponse
      .json()
      .codeSets.find(
        (codeSet: { codeSetId: string }) => codeSet.codeSetId === "industries",
      );

    expect(vocabularyAfterDeleteResponse.statusCode).toBe(200);
    expect(
      industriesAfterDelete.codes.map(
        (code: { codeId: string }) => code.codeId,
      ),
    ).not.toContain("edtech");

    const vocabularyAfterBackfillResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });
    const industriesAfterBackfill = vocabularyAfterBackfillResponse
      .json()
      .codeSets.find(
        (codeSet: { codeSetId: string }) => codeSet.codeSetId === "industries",
      );

    expect(
      industriesAfterBackfill.codes.map(
        (code: { codeId: string }) => code.codeId,
      ),
    ).not.toContain("edtech");

    const recreateDeletedResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vocabulary/industries/codes",
      payload: {
        codeId: "edtech",
        name: "EdTech",
        active: true,
      },
    });

    expect(recreateDeletedResponse.statusCode).toBe(404);

    const saveDeletedCodeResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        company: {
          ...profileBody.company,
          industries: ["edtech"],
        },
      },
    });

    expect(saveDeletedCodeResponse.statusCode).toBe(400);
  });

  it("rejects unknown controlled codes and countries", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        company: {
          ...profileBody.company,
          country: "ZZ",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("COUNTRY_NOT_FOUND");
  });

  it("returns system and organization templates", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/templates",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      systemTemplates: [
        {
          slug: "data-security-policy",
          name: "Data Security Policy",
          description:
            "A customer-facing data security policy based on access control, encryption, monitoring, incident response, backup, and vendor risk data.",
        },
        {
          slug: "incident-response-plan",
          name: "Incident Response Plan",
          description: "A lightweight incident response outline.",
        },
        {
          slug: "privacy-policy",
          name: "Privacy Policy",
          description:
            "A customer-facing privacy policy based on the organization's privacy, service, and vendor data.",
        },
        {
          slug: "security-policy",
          name: "Security Policy",
          description: "A practical starter security policy.",
        },
        {
          slug: "subprocessors",
          name: "Subprocessors",
          description:
            "A customer-facing subprocessor summary based on the organization's vendor data processors.",
        },
      ],
      organizationTemplates: [],
    });
  });

  it("returns template schema variables", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/templates/schema",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      version: 1,
      variables: expect.arrayContaining([
        expect.objectContaining({
          key: "organization.name",
          type: "string",
          category: "Organization",
        }),
        expect.objectContaining({
          key: "vendors.dataProcessors",
          type: "collection",
          category: "Vendors",
          itemFields: expect.arrayContaining([
            expect.objectContaining({ key: "name", type: "string" }),
          ]),
        }),
      ]),
    });
  });

  it("previews draft templates without generating documents", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates/preview",
      payload: {
        name: "Security Policy",
        content:
          "# {{ company.name }} Security Policy\nVersion {{ policy.version }}\n",
        policyVersion: "1.0",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      renderedContent: "# Acme AI Security Policy\nVersion 1.0\n",
    });

    const documentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(documentsResponse.json()).toEqual([]);
  });

  it("returns structured errors for invalid template previews", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates/preview",
      payload: {
        name: "Broken Policy",
        content: "{% if company.name %}",
        policyVersion: "",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("TEMPLATE_RENDER_FAILED");
  });

  it("copies, edits, and deletes organization templates", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "security-policy" },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdTemplate = createResponse.json();
    expect(createdTemplate).toMatchObject({
      name: "Security Policy",
      slug: "security-policy",
      sourceSystemTemplateSlug: "security-policy",
      content: "# {{ company.name }} Security Policy\n",
      policyVersion: "",
    });

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
      payload: {
        name: "Customer Security Policy",
        content: "# Updated policy\n",
        policyVersion: "1.0",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      name: "Customer Security Policy",
      slug: "security-policy",
      sourceSystemTemplateSlug: "security-policy",
      content: "# Updated policy\n",
      policyVersion: "1.0",
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/templates",
    });
    expect(listResponse.json().organizationTemplates).toHaveLength(1);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("creates custom organization templates from scratch", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: {
        name: "Custom Policy",
        content: "# Custom policy\n",
        policyVersion: "",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      name: "Custom Policy",
      slug: "custom-policy",
      sourceSystemTemplateSlug: null,
      content: "# Custom policy\n",
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: {
        name: "Custom Policy",
        content: "# Duplicate\n",
        policyVersion: "",
      },
    });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json().error.code).toBe("TEMPLATE_SLUG_EXISTS");

    const documentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });

    expect(documentsResponse.statusCode).toBe(200);
    expect(documentsResponse.json()).toMatchObject([
      {
        template: {
          id: createResponse.json().id,
          slug: "custom-policy",
          sourceSystemTemplateSlug: null,
        },
        document: null,
        status: "not_generated",
      },
    ]);
  });

  it("rejects missing system templates", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "missing-template" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("SYSTEM_TEMPLATE_NOT_FOUND");
  });

  it("generates documents from templates and reports stale documents", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const createTemplateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "security-policy" },
    });
    const template = createTemplateResponse.json();

    await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Security Policy",
        content:
          '# {{ company.name }} Security Policy\n\nService {{ service.name }} for {{ service.userTypeLabels | join(", ") }}\nPrivacy rights: {{ privacy.supportedRightLabels | join(", ") }}\nVersion {{ policy.version }}\n',
        policyVersion: "1.0",
      },
    });

    const emptyDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(emptyDocumentsResponse.statusCode).toBe(200);
    expect(emptyDocumentsResponse.json()).toMatchObject([
      {
        template: { id: template.id, slug: "security-policy" },
        document: null,
        status: "not_generated",
      },
    ]);

    const generateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    });

    expect(generateResponse.statusCode).toBe(201);
    expect(generateResponse.json()).toMatchObject({
      templateId: template.id,
      title: "Security Policy",
      renderedContent:
        "# Acme AI Security Policy\n\nService Acme AI Platform for Workspace admins, End users\nPrivacy rights: Access, Deletion, Correction, Opt-out\nVersion 1.0\n",
      hasPdf: false,
    });
    expect(generateResponse.json().sourceHash).toHaveLength(64);

    const currentDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(currentDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          supportedRights: ["access", "deletion"],
        },
      },
    });
    const privacyStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(privacyStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const restoredDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(restoredDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              primaryHostingRegion: "eu",
            },
          },
        ],
      },
    });
    const transferStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(transferStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          logRetentionDays: 180,
        },
      },
    });
    const securityStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(securityStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              cookieTrackingCategories: [
                "necessary",
                "analytics",
                "preference",
              ],
            },
          },
        ],
      },
    });
    const cookieStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(cookieStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json().error.code).toBe("DOCUMENT_ALREADY_EXISTS");

    const documentResponse = await app.inject({
      method: "GET",
      url: `/organizations/org-test/documents/${generateResponse.json().id}`,
    });
    expect(documentResponse.statusCode).toBe(200);
    expect(documentResponse.json().renderedContent).toBe(
      "# Acme AI Security Policy\n\nService Acme AI Platform for Workspace admins, End users\nPrivacy rights: Access, Deletion, Correction, Opt-out\nVersion 1.0\n",
    );

    await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Security Policy",
        content:
          '# {{ company.name }} Security Policy\n\nService {{ service.name }} for {{ service.userTypeLabels | join(", ") }}\nPrivacy rights: {{ privacy.supportedRightLabels | join(", ") }}\nVersion {{ policy.version }}\n',
        policyVersion: "1.1",
      },
    });

    const staleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(staleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);
  });

  it("rejects document generation for missing templates", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: "template_missing" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("TEMPLATE_NOT_FOUND");
  });

  it("rejects vendor data processed outside organization data types", async () => {
    const app = await createTestApp();
    const profileResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const serviceId = profileResponse.json().organization.services[0].id;

    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/service-provider-usage",
      payload: {
        ...vendorUseBody,
        serviceId,
        organizationProviderId: (
          await app.inject({
            method: "POST",
            url: "/organizations/org-test/organization-providers",
            payload: vendorBody,
          })
        ).json().id,
        dataProcessed: ["source_code"],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "PROVIDER_DATA_TYPE_NOT_FOUND",
        details: { dataProcessed: ["source_code"] },
      },
    });
  });

  it("returns provider catalog entries", async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/providers" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
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
    ]);
  });

  it("requires a bearer API key for provider lookup", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerLookupApiKey: "test-api-key",
      providerLookupService: {
        async lookup() {
          return providerLookupResult;
        },
      },
    });
    const missingResponse = await app.inject({
      method: "POST",
      url: "/providers/lookup",
      payload: { inputUrl: "https://github.com" },
    });
    const invalidResponse = await app.inject({
      method: "POST",
      url: "/providers/lookup",
      headers: { authorization: "Bearer wrong-key" },
      payload: { inputUrl: "https://github.com" },
    });

    expect(missingResponse.statusCode).toBe(401);
    expect(invalidResponse.statusCode).toBe(401);
    expect(missingResponse.json()).toMatchObject({
      error: { code: "API_KEY_AUTHENTICATION_REQUIRED" },
    });
  });

  it("validates provider lookup input URLs", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerLookupApiKey: "test-api-key",
      providerLookupService: {
        async lookup() {
          return providerLookupResult;
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/providers/lookup",
      headers: { authorization: "Bearer test-api-key" },
      payload: { inputUrl: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED" },
    });
  });

  it("returns provider lookup results from the resolver", async () => {
    const calls: string[] = [];
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerLookupApiKey: "test-api-key",
      providerLookupService: {
        async lookup(inputUrl) {
          calls.push(inputUrl);
          return providerLookupResult;
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/providers/lookup",
      headers: { authorization: "Bearer test-api-key" },
      payload: { inputUrl: "https://github.com" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(providerLookupResult);
    expect(calls).toEqual(["https://github.com"]);
  });

  it("returns provider import results from the importer", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerLookupApiKey: "test-api-key",
      providerLookupService: {
        async lookup() {
          return providerLookupResult;
        },
      },
      providerImportService: {
        async importProvider(inputUrl) {
          return {
            organizationRecordId: "rec-org",
            providerRecordId: "rec-provider",
            organizationAction: "created",
            providerAction: "created",
            lookup: {
              ...providerLookupResult,
              provider: {
                ...providerLookupResult.provider,
                url: inputUrl,
              },
            },
          };
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/providers/import",
      headers: { authorization: "Bearer test-api-key" },
      payload: { inputUrl: "https://github.com" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      organizationRecordId: "rec-org",
      providerRecordId: "rec-provider",
      organizationAction: "created",
      providerAction: "created",
      lookup: {
        provider: { url: "https://github.com" },
      },
    });
  });

  it("allows provider import with API key when cookie authentication is enabled", async () => {
    const app = await createApp({
      auth: authConfig,
      ...createInMemoryRepositories(),
      providerLookupApiKey: "test-api-key",
      providerLookupService: {
        async lookup() {
          return providerLookupResult;
        },
      },
      providerImportService: {
        async importProvider() {
          return {
            organizationRecordId: "rec-org",
            providerRecordId: "rec-provider",
            organizationAction: "created",
            providerAction: "created",
            lookup: providerLookupResult,
          };
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/providers/import",
      headers: { authorization: "Bearer test-api-key" },
      payload: { inputUrl: "https://github.com" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      organizationRecordId: "rec-org",
      providerRecordId: "rec-provider",
    });
  });

  it("passes Airtable lookup codes into the provider lookup prompt", async () => {
    let promptVariables: Record<string, string> | null = null;
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [{ code: "source_control", name: "Source control" }],
        systemTypes: [{ code: "source_control", name: "Source control" }],
      }),
      {
        async compilePrompt(_name, variables) {
          promptVariables = variables;
          return {
            content: "resolved prompt",
            metadata: {
              name: "resolve_provider",
              version: 1,
              isFallback: false,
            },
          };
        },
      },
      {
        async generateJson() {
          return providerLookupResult;
        },
      },
      "gemini-2.5-flash",
    );

    await service.lookup("https://github.com");

    expect(promptVariables).toMatchObject({
      inputUrl: "https://github.com",
    });
    expect(JSON.parse(promptVariables?.categories ?? "[]")).toEqual([
      { code: "source_control", name: "Source control" },
    ]);
    expect(JSON.parse(promptVariables?.systemTypes ?? "[]")).toEqual([
      { code: "source_control", name: "Source control" },
    ]);
  });

  it("rejects invalid provider lookup JSON shapes", async () => {
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [{ code: "source_control", name: "Source control" }],
        systemTypes: [{ code: "source_control", name: "Source control" }],
      }),
      {
        async compilePrompt() {
          return {
            content: "resolved prompt",
            metadata: {
              name: "resolve_provider",
              version: 1,
              isFallback: false,
            },
          };
        },
      },
      {
        async generateJson() {
          return { provider: { name: "GitHub" } };
        },
      },
      "gemini-2.5-flash",
    );

    await expect(service.lookup("https://github.com")).rejects.toMatchObject({
      code: "PROVIDER_LOOKUP_INVALID_RESPONSE",
      statusCode: 502,
    });
  });

  it("rejects provider lookup codes that are not in Airtable", async () => {
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [{ code: "source_control", name: "Source control" }],
        systemTypes: [{ code: "source_control", name: "Source control" }],
      }),
      {
        async compilePrompt() {
          return {
            content: "resolved prompt",
            metadata: {
              name: "resolve_provider",
              version: 1,
              isFallback: false,
            },
          };
        },
      },
      {
        async generateJson() {
          return {
            ...providerLookupResult,
            provider: {
              ...providerLookupResult.provider,
              category: "unknown_category",
            },
          };
        },
      },
      "gemini-2.5-flash",
    );

    await expect(service.lookup("https://github.com")).rejects.toMatchObject({
      code: "PROVIDER_LOOKUP_UNKNOWN_CODE",
      statusCode: 502,
      details: {
        codeSetId: "vendor_category",
        field: "provider.category",
        value: "unknown_category",
      },
    });
  });

  it("creates Airtable organization and provider records during provider import", async () => {
    const client = new InMemoryAirtableImportClient({
      "Provider Categories": [
        {
          id: "rec-category",
          fields: { Code: "source-control", Name: "Source Control" },
        },
      ],
    });
    const service = new AirtableProviderImportService(
      {
        async lookup() {
          return providerLookupResult;
        },
      },
      client,
    );
    const result = await service.importProvider("https://github.com");

    expect(result).toMatchObject({
      organizationAction: "created",
      providerAction: "created",
    });
    expect(client.records["Provider Organizations"][0]?.fields).toMatchObject({
      Id: "",
      Name: "GitHub",
      "Legal Name": "GitHub, Inc.",
      Website: "https://github.com",
    });
    expect(client.records.Providers[0]?.fields).toMatchObject({
      Id: "",
      Name: "GitHub",
      Url: "https://github.com",
      Purpose: "Source code hosting",
      "System Type": "source_control",
      "Security Relevance": "Critical",
      "Handles Customer Data": false,
      Organizatzion: [result.organizationRecordId],
      "Provider Categories": ["rec-category"],
    });
  });

  it("updates existing Airtable organization and provider records during provider import", async () => {
    const client = new InMemoryAirtableImportClient({
      "Provider Categories": [
        {
          id: "rec-category",
          fields: { Code: "source-control", Name: "Source Control" },
        },
      ],
      "Provider Organizations": [
        {
          id: "rec-org-existing",
          fields: { Website: "https://github.com", Name: "Old GitHub" },
        },
      ],
      Providers: [
        {
          id: "rec-provider-existing",
          fields: { Url: "https://github.com", Name: "Old Provider" },
        },
      ],
    });
    const service = new AirtableProviderImportService(
      {
        async lookup() {
          return providerLookupResult;
        },
      },
      client,
    );
    const result = await service.importProvider("https://github.com");

    expect(result).toMatchObject({
      organizationRecordId: "rec-org-existing",
      providerRecordId: "rec-provider-existing",
      organizationAction: "updated",
      providerAction: "updated",
    });
    expect(client.records["Provider Organizations"][0]?.fields.Name).toBe(
      "GitHub",
    );
    expect(client.records.Providers[0]?.fields.Organizatzion).toEqual([
      "rec-org-existing",
    ]);
  });

  it("rejects provider import when the Airtable category is missing", async () => {
    const service = new AirtableProviderImportService(
      {
        async lookup() {
          return providerLookupResult;
        },
      },
      new InMemoryAirtableImportClient(),
    );

    await expect(service.importProvider("https://github.com")).rejects.toMatchObject({
      code: "PROVIDER_IMPORT_CATEGORY_NOT_FOUND",
      statusCode: 400,
    });
  });

  it("returns provider catalog upstream failures as structured gateway errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            error: {
              type: "AUTHENTICATION_REQUIRED",
              message: "Invalid authentication token",
            },
          }),
          { status: 401, statusText: "Unauthorized" },
        );
      }),
    );
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerSource: new AirtableProviderSource("app-test", "pat-test"),
    });
    const response = await app.inject({ method: "GET", url: "/providers" });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      error: {
        code: "PROVIDER_CATALOG_LOAD_FAILED",
        details: {
          status: 401,
          statusText: "Unauthorized",
        },
      },
    });
  });

  it("logs unexpected request failures with error details", async () => {
    let logOutput = "";
    const app = await createApp({
      auth: false,
      logger: {
        level: "error",
        stream: {
          write(chunk) {
            logOutput += chunk;
          },
        },
      },
      ...createInMemoryRepositories(),
      providerSource: {
        async listProviders() {
          throw new Error("catalog exploded");
        },
      },
    });
    const response = await app.inject({ method: "GET", url: "/providers" });

    expect(response.statusCode).toBe(500);
    expect(logOutput).toContain("request failed");
    expect(logOutput).toContain("catalog exploded");
    expect(logOutput).toContain("/providers");
  });
});

class InMemoryAirtableImportClient extends AirtableProviderImportClient {
  records: Record<string, Array<{ id: string; fields: Record<string, unknown> }>>;

  constructor(
    records: Record<string, Array<{ id: string; fields: Record<string, unknown> }>> = {},
  ) {
    super("app-test", "pat-test");
    this.records = {
      "Provider Categories": [],
      "Provider Organizations": [],
      Providers: [],
      ...records,
    };
  }

  override async listRecords(tableName: string, filterByFormula?: string) {
    const records = this.records[tableName] ?? [];
    const match = filterByFormula?.match(/^\{(.+)\} = '(.+)'$/);

    if (!match) {
      return records;
    }

    const [, fieldName, value] = match;
    return records.filter((record) => record.fields[fieldName] === value);
  }

  override async createRecord(
    tableName: string,
    fields: Record<string, unknown>,
  ) {
    const record = {
      id: `rec-${tableName.replace(/\s+/g, "-")}-${this.records[tableName]?.length ?? 0}`,
      fields,
    };

    this.records[tableName] = [...(this.records[tableName] ?? []), record];
    return record;
  }

  override async updateRecord(
    tableName: string,
    recordId: string,
    fields: Record<string, unknown>,
  ) {
    const tableRecords = this.records[tableName] ?? [];
    const record = tableRecords.find((current) => current.id === recordId);

    if (!record) {
      throw new Error(`Record ${recordId} was not found.`);
    }

    record.fields = { ...record.fields, ...fields };
    return record;
  }
}

function createInMemoryRepositories() {
  const accountRepository = new InMemoryAccountRepository();
  const organizationRepository = new InMemoryOrganizationRepository();

  return {
    accountRepository,
    documentRepository: new InMemoryDocumentRepository(organizationRepository),
    organizationRepository,
    vendorRepository: new InMemoryVendorRepository(organizationRepository),
  };
}
