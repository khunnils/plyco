import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { createTestApp } from "./helpers.js";
import {
  LlmOrganizationLookupService,
  StaticOrganizationLookupCodeSource,
} from "../src/features/organization-lookup/service.js";
import { ApiError } from "../src/infrastructure/errors.js";
import { type LlmJsonClient } from "../src/infrastructure/llm-client.js";
import { type PromptClient } from "../src/infrastructure/prompt-client.js";
import {
  authConfig,
  createInMemoryRepositories,
  profileBody,
  saveProfileDraft,
  serviceBody,
  vendorBody,
  vendorUseBody,
} from "./helpers.js";

const lookupCodeSource = new StaticOrganizationLookupCodeSource({
  industries: ["technology_saas"],
  regions: ["us", "eu", "global"],
  subject_types: ["customer"],
  collection_methods: ["account_signup"],
  activity_role: ["controller"],
  legal_basis: ["contract"],
  activity_retention_policies: ["fixed", "not_defined"],
  privacy_supported_rights: ["access", "deletion"],
  privacy_request_methods: ["email"],
  defined_statuses: ["defined", "not_defined"],
  privacy_transfer_mechanisms: ["sccs"],
  privacy_dpo_statuses: ["not_required"],
  privacy_eu_representative_statuses: ["not_required"],
});

class CapturingPromptClient implements PromptClient {
  variables: Record<string, unknown> | null = null;
  calls: Array<{ name: string; variables: Record<string, unknown> }> = [];

  async compilePrompt(name: string, variables: Record<string, unknown>) {
    this.variables = variables;
    this.calls.push({ name, variables });

    return {
      content: `${name} prompt`,
      inputVariables: variables,
      metadata: {
        name,
        version: 1,
        isFallback: false,
      },
    };
  }
}

class StubLlmClient implements LlmJsonClient {
  request: Parameters<LlmJsonClient["generateJson"]>[0] | null = null;

  constructor(private readonly response: unknown) {}

  async generateJson(request: Parameters<LlmJsonClient["generateJson"]>[0]) {
    this.request = request;
    return this.response;
  }
}

const validWebsiteLookupGenerated = {
  legalEntityName: "Acme AI, Inc.",
  registeredCountry: "US",
  address: "1 Market St, San Francisco, CA",
  industries: ["technology_saas"],
  regions: ["us"],
  handlesPii: true,
  handlesSensitiveData: false,
  handlesHealthData: false,
  handlesPersonalData: true,
  primaryService: {
    name: "Acme AI",
    description: "Secure SaaS products for customers.",
    activities: [
      {
        name: "Account management",
        purpose: "",
      },
    ],
    dataCaptured: [
      {
        name: "Customer account data",
        description: null,
      },
    ],
  },
  contactEmail: "hello@acme.example",
  securityEmail: "security@acme.example",
  privacyEmail: "privacy@acme.example",
  privacyPolicyUrl: "https://acme.example/privacy",
  warnings: [],
};

const validPrivacyLookupGenerated = {
  supportedRights: ["access", "deletion"],
  requestMethods: ["email"],
  responseTimelineDaysStatus: "defined",
  responseTimelineDays: 30,
  identityVerificationRequired: true,
  authorizedAgentSupported: true,
  appealProcessExists: false,
  sendsMarketingEmails: true,
  transactionalEmailsSent: true,
  crossBorderTransfers: true,
  transferMechanisms: ["sccs"],
  sellsOrSharesData: false,
  usesAutomatedDecisionMaking: false,
  productionDataInDevelopment: false,
  retentionPolicyExists: true,
  dpoStatus: "not_required",
  dpoName: null,
  dpoEmail: null,
  euRepresentativeStatus: "not_required",
  euRepresentativeName: null,
  euRepresentativeAddress: null,
};

describe("organizations API", () => {
  it("reorders services, data types, and business activities", async () => {
    const app = await createTestApp();
    const profileResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        services: [
          { ...serviceBody, serviceName: "First service" },
          { ...serviceBody, serviceName: "Second service" },
        ],
        dataHandling: {
          dataTypesStored: [
            {
              name: "First data type",
              description: null,
              subjectTypes: [],
              collectionMethods: [],
              isSensitive: false,
              isRequired: false,
            },
            {
              name: "Second data type",
              description: null,
              subjectTypes: [],
              collectionMethods: [],
              isSensitive: false,
              isRequired: false,
            },
          ],
        },
      });
    const organization = profileResponse.json().organization;
    const serviceIds = organization.services.map(
      (service: { id: string }) => service.id,
    );
    const dataTypeIds = organization.dataHandling.dataTypesStored.map(
      (dataType: { id: string }) => dataType.id,
    );
    expect(
      organization.services.map(
        (service: { sortOrder: number }) => service.sortOrder,
      ),
    ).toEqual([0, 1]);
    expect(
      organization.dataHandling.dataTypesStored.map(
        (dataType: { sortOrder: number }) => dataType.sortOrder,
      ),
    ).toEqual([0, 1]);

    const firstActivity = await app.inject({
      method: "POST",
      url: "/organizations/org-test/business-activities",
      payload: {
        name: "First activity",
        purpose: "",
        role: "",
        legalBasis: [],
        dataTypeIds: [],
        retentionPolicy: null,
        retentionDays: 0,
      },
    });
    const secondActivity = await app.inject({
      method: "POST",
      url: "/organizations/org-test/business-activities",
      payload: {
        name: "Second activity",
        purpose: "",
        role: "",
        legalBasis: [],
        dataTypeIds: [],
        retentionPolicy: null,
        retentionDays: 0,
      },
    });
    const activityIds = [firstActivity.json().id, secondActivity.json().id];
    expect([
      firstActivity.json().sortOrder,
      secondActivity.json().sortOrder,
    ]).toEqual([0, 1]);

    for (const [url, ids] of [
      ["/organizations/org-test/services/order", serviceIds.toReversed()],
      ["/organizations/org-test/data-types/order", dataTypeIds.toReversed()],
      [
        "/organizations/org-test/business-activities/order",
        activityIds.toReversed(),
      ],
    ] as const) {
      const response = await app.inject({
        method: "PUT",
        url,
        payload: { ids },
      });
      expect(response.statusCode).toBe(204);
    }

    const snapshot = (
      await app.inject({ method: "GET", url: "/organizations/org-test" })
    ).json();
    expect(
      snapshot.organization.services.map(
        (service: { id: string }) => service.id,
      ),
    ).toEqual(serviceIds.toReversed());
    expect(
      snapshot.organization.dataHandling.dataTypesStored.map(
        (dataType: { id: string }) => dataType.id,
      ),
    ).toEqual(dataTypeIds.toReversed());
    expect(
      snapshot.businessActivities.map(
        (activity: { id: string }) => activity.id,
      ),
    ).toEqual(activityIds.toReversed());
    expect(
      snapshot.organization.services.map(
        (service: { sortOrder: number }) => service.sortOrder,
      ),
    ).toEqual([0, 1]);
    expect(
      snapshot.organization.dataHandling.dataTypesStored.map(
        (dataType: { sortOrder: number }) => dataType.sortOrder,
      ),
    ).toEqual([0, 1]);
    expect(
      snapshot.businessActivities.map(
        (activity: { sortOrder: number }) => activity.sortOrder,
      ),
    ).toEqual([0, 1]);

    for (const [url, ids, errorCode] of [
      [
        "/organizations/org-test/services/order",
        serviceIds,
        "SERVICE_ORDER_INVALID",
      ],
      [
        "/organizations/org-test/data-types/order",
        dataTypeIds,
        "DATA_TYPE_ORDER_INVALID",
      ],
      [
        "/organizations/org-test/business-activities/order",
        activityIds,
        "BUSINESS_ACTIVITY_ORDER_INVALID",
      ],
    ] as const) {
      for (const invalidIds of [
        [ids[0]],
        [ids[0], ids[0]],
        [ids[0], "foreign-id"],
      ]) {
        const response = await app.inject({
          method: "PUT",
          url,
          payload: { ids: invalidIds },
        });
        expect(response.statusCode).toBe(400);
        expect(response.json().error.code).toBe(errorCode);
      }
    }
  });

  it("requires authentication for organization lookup when auth is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      organizationLookupService: {
        async lookupWebsite() {
          throw new Error("should not be called");
        },
        async lookupPrivacyPolicy() {
          throw new Error("should not be called");
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup/website",
      payload: { website: "https://acme.example" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: "AUTHENTICATION_REQUIRED" },
    });
  });

  it("validates organization lookup input", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      organizationLookupService: {
        async lookupWebsite() {
          throw new Error("should not be called");
        },
        async lookupPrivacyPolicy() {
          throw new Error("should not be called");
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup/website",
      payload: { website: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED" },
    });
  });

  it("returns organization lookup results from the lookup service", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      organizationLookupService: {
        async lookupWebsite(input) {
          return {
            company: {
              ...profileBody.company,
              companyName: "Acme Lookup",
              website: input.website,
            },
            primaryService: serviceBody,
            dataTypes: profileBody.dataHandling.dataTypesStored,
            activities: [
              {
                name: "Account management",
                purpose: "Create and manage customer accounts.",
                role: "",
                legalBasis: [],
                retentionPolicy: null,
                retentionDays: 0,
                usesAi: null,
                aiUseCases: "",
                aiCustomerDataUsedForTraining: null,
                aiCustomerDataSentToProviders: null,
                aiHumanReviewOfOutputs: null,
                aiUsersInformedWhenUsed: null,
              },
            ],
            suggestedProviders: [{ name: "GitHub", url: "https://github.com" }],
            policyLinks: [
              {
                type: "privacy_policy",
                title: "Privacy Policy",
                url: "https://acme.example/privacy",
              },
            ],
            privacyPolicyUrl: "https://acme.example/privacy",
            warnings: [],
          };
        },
        async lookupPrivacyPolicy() {
          return profileBody.privacy;
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup/website",
      payload: { website: "https://acme.example" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      company: {
        companyName: "Acme Lookup",
        website: "https://acme.example",
      },
      primaryService: serviceBody,
      dataTypes: profileBody.dataHandling.dataTypesStored,
      activities: [
        expect.objectContaining({
          name: "Account management",
          purpose: "Create and manage customer accounts.",
        }),
      ],
      suggestedProviders: [{ name: "GitHub", url: "https://github.com" }],
    });
  });

  it("returns structured errors when organization lookup fails upstream", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      organizationLookupService: {
        async lookupWebsite() {
          throw new ApiError(
            "ORGANIZATION_LOOKUP_AGENT_FAILED",
            "Organization lookup agent failed.",
            502,
          );
        },
        async lookupPrivacyPolicy() {
          return profileBody.privacy;
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup/website",
      payload: { website: "https://acme.example" },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      error: { code: "ORGANIZATION_LOOKUP_AGENT_FAILED" },
    });
  });

  it("returns privacy policy lookup results from the lookup service", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      organizationLookupService: {
        async lookupWebsite() {
          throw new Error("should not be called");
        },
        async lookupPrivacyPolicy(input) {
          expect(input.privacyPolicyUrl).toBe("https://acme.example/privacy");
          return {
            ...profileBody.privacy,
            supportedRights: ["access", "deletion"],
            requestMethods: ["email"],
          };
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup/privacy-policy",
      payload: { privacyPolicyUrl: "https://acme.example/privacy" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      supportedRights: ["access", "deletion"],
      requestMethods: ["email"],
    });
  });

  it("passes allowed vocabulary code ids to the website lookup prompt", async () => {
    const promptClient = new CapturingPromptClient();
    const llmClient = new StubLlmClient(validWebsiteLookupGenerated);
    const service = new LlmOrganizationLookupService(
      lookupCodeSource,
      promptClient,
      llmClient,
      "test-model",
    );

    await service.lookupWebsite({
      website: "https://acme.example",
    });

    expect(promptClient.calls[0]?.name).toBe("website_parser");
    expect(promptClient.variables).toMatchObject({
      websiteUrl: "https://acme.example",
    });
    expect(promptClient.variables).not.toHaveProperty("organizationName");
    expect(promptClient.variables).not.toHaveProperty("pages");

    const codeSets = promptClient.variables?.codeSets;
    expect(codeSets).toContain("industries\n");
    expect(codeSets).toContain(" - technology_saas");
    expect(codeSets).toContain("activity_role\n");
    expect(codeSets).toContain(" - controller");
    expect(codeSets).not.toContain("Technology / SaaS");
    expect(codeSets).not.toContain("Controller");
  });

  it("constrains website lookup schema fields to code ids and enables URL tools", async () => {
    const llmClient = new StubLlmClient(validWebsiteLookupGenerated);
    const service = new LlmOrganizationLookupService(
      lookupCodeSource,
      new CapturingPromptClient(),
      llmClient,
      "test-model",
    );

    await service.lookupWebsite({
      website: "https://acme.example",
    });

    const schema = llmClient.request?.responseSchema as {
      properties: Record<string, any>;
    };
    expect(schema.properties.industries.items.enum).toContain(
      "technology_saas",
    );
    expect(schema.properties.industries.items.enum).not.toContain(
      "Technology / SaaS",
    );
    expect(schema.properties.regions.items.enum).toEqual([
      "us",
      "eu",
      "global",
    ]);
    expect(llmClient.request?.tools).toEqual([
      { googleSearch: {} },
      { urlContext: {} },
    ]);
  });

  it("maps multiple website lookup activities and data types", async () => {
    const service = new LlmOrganizationLookupService(
      lookupCodeSource,
      new CapturingPromptClient(),
      new StubLlmClient({
        ...validWebsiteLookupGenerated,
        primaryService: {
          ...validWebsiteLookupGenerated.primaryService,
          activities: [
            { name: "Account management", purpose: "" },
            { name: "Billing", purpose: "" },
            { name: "Account management", purpose: "" },
          ],
          dataCaptured: [
            { name: "Customer account data", description: null },
            { name: "Payment data", description: null },
            { name: "", description: null },
          ],
        },
      }),
      "test-model",
    );

    const result = await service.lookupWebsite({
      website: "https://acme.example",
    });

    expect(result.activities).toEqual([
      expect.objectContaining({ name: "Account management", purpose: "" }),
      expect.objectContaining({ name: "Billing", purpose: "" }),
    ]);
    expect(result.dataTypes).toEqual([
      expect.objectContaining({
        name: "Customer account data",
        description: null,
      }),
      expect.objectContaining({ name: "Payment data", description: null }),
    ]);
  });

  it("passes privacy code ids to the privacy policy prompt", async () => {
    const promptClient = new CapturingPromptClient();
    const service = new LlmOrganizationLookupService(
      lookupCodeSource,
      promptClient,
      new StubLlmClient(validPrivacyLookupGenerated),
      "test-model",
    );

    const result = await service.lookupPrivacyPolicy({
      privacyPolicyUrl: "https://acme.example/privacy",
    });

    expect(promptClient.calls[0]?.name).toBe("privacy_policy_parser");
    expect(promptClient.variables).toMatchObject({
      privacyPolicyUrl: "https://acme.example/privacy",
    });
    expect(promptClient.variables?.codeSets).toContain(
      "privacy_supported_rights\n",
    );
    expect(promptClient.variables?.codeSets).toContain(" - access");
    expect(promptClient.variables?.codeSets).not.toContain("Access");
    expect(result.supportedRights).toEqual(["access", "deletion"]);
  });

  it("rejects organization lookup label values instead of normalizing them", async () => {
    const service = new LlmOrganizationLookupService(
      lookupCodeSource,
      new CapturingPromptClient(),
      new StubLlmClient({
        ...validWebsiteLookupGenerated,
        industries: ["Technology / SaaS"],
      }),
      "test-model",
    );

    await expect(
      service.lookupWebsite({
        website: "https://acme.example",
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_WEBSITE_LOOKUP_INVALID_RESPONSE",
    });
  });

  it("creates and returns organization security profile services", async () => {
    const app = await createTestApp();
    const saveResponse = await saveProfileDraft(app, "org-test", profileBody);

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json().organization.company.companyName).toBe(
      "Acme AI",
    );
    expect(saveResponse.json().organization.company.legalEntityName).toBe(
      "Acme AI, Inc.",
    );
    expect(
      saveResponse
        .json()
        .organization.dataHandling.dataTypesStored.map(
          ({
            id: _id,
            sortOrder: _sortOrder,
            ...dataType
          }: {
            id: string;
            sortOrder: number;
          }) => dataType,
        ),
    ).toEqual(profileBody.dataHandling.dataTypesStored);
    expect(
      saveResponse
        .json()
        .organization.dataHandling.dataTypesStored.every(
          (dataType: { id?: string }) => Boolean(dataType.id),
        ),
    ).toBe(true);
    expect(saveResponse.json().organization.services).toEqual([
      expect.objectContaining(profileBody.services[0]),
    ]);
    expect(saveResponse.json().organization.privacy).toEqual(
      profileBody.privacy,
    );
    expect(saveResponse.json().organization.infrastructure).toMatchObject(
      profileBody.infrastructure,
    );
    expect(saveResponse.json().organization.security).toEqual(
      profileBody.security,
    );

    const getResponse = await app.inject({ method: "GET", url: "/organizations/org-test" });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().organization.company.companyName).toBe("Acme AI");
    expect(
      getResponse
        .json()
        .organization.dataHandling.dataTypesStored.map(
          ({
            id: _id,
            sortOrder: _sortOrder,
            ...dataType
          }: {
            id: string;
            sortOrder: number;
          }) => dataType,
        ),
    ).toEqual(profileBody.dataHandling.dataTypesStored);
    expect(
      getResponse
        .json()
        .organization.dataHandling.dataTypesStored.every(
          (dataType: { id?: string }) => Boolean(dataType.id),
        ),
    ).toBe(true);
    expect(getResponse.json().organization.services).toEqual([
      expect.objectContaining(profileBody.services[0]),
    ]);
    expect(getResponse.json().organization.privacy).toEqual(
      profileBody.privacy,
    );
    expect(getResponse.json().organization.security).toEqual(
      profileBody.security,
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
    const saveResponse = await saveProfileDraft(app, "org-test", explicitEmptyProfile);

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
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        services: [
          {
            ...profileBody.services[0],
            userTypes: ["not_a_real_user_type"],
          },
        ],
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
    const saveResponse = await saveProfileDraft(app, "org-test", {
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
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          supportedRights: ["not_a_real_right"],
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
    const invalidCookieTypeResponse = await saveProfileDraft(app, "org-test", {
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

    const invalidConsentResponse = await saveProfileDraft(app, "org-test", {
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

    const invalidWithdrawalResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              cookieConsentWithdrawalMethod: "not_a_real_method",
            },
          },
        ],
      });

    expect(invalidWithdrawalResponse.statusCode).toBe(400);
    expect(invalidWithdrawalResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "privacy_cookie_consent_withdrawal_methods",
          field: "services.0.privacy.cookieConsentWithdrawalMethod",
          value: "not_a_real_method",
        },
      },
    });
  });

  it("rejects infrastructure providers that are not available for the selected system type", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
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

  it("preserves explicit 'none' infrastructure providers outside inventory", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
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
              systemType: "auth",
              providerId: "none",
            },
            {
              systemType: "password_manager",
              providerId: "none",
            },
          ],
        },
      });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().organization.infrastructure.organizationProviders,
    ).toEqual([
      { systemType: "cloud", providerId: "none", name: "None" },
      { systemType: "source_control", providerId: "none", name: "None" },
      { systemType: "auth", providerId: "none", name: "None" },
      { systemType: "password_manager", providerId: "none", name: "None" },
    ]);
    expect(response.json().organizationProviders).toEqual([]);
  });

  it("preserves an explicit 'none' newsletter provider outside inventory", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          organizationProviders: [
            { systemType: "newsletter", providerId: "none" },
          ],
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.json().organization.privacy.organizationProviders).toEqual([
      { systemType: "newsletter", providerId: "none", name: "None" },
    ]);
    expect(response.json().organizationProviders).toEqual([]);
  });

  it("replaces explicit none with a real infrastructure provider", async () => {
    const app = await createTestApp();
    await saveProfileDraft(app, "org-test", {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          organizationProviders: [
            { systemType: "source_control", providerId: "none" },
          ],
        },
      });

    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          organizationProviders: [
            { systemType: "source_control", providerId: "prov-github" },
          ],
        },
      });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().organization.infrastructure.organizationProviders,
    ).toEqual([
      {
        systemType: "source_control",
        providerId: "prov-github",
        name: "GitHub",
      },
    ]);
  });

  it("rejects none alongside a real provider for the same system type", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          organizationProviders: [
            { systemType: "source_control", providerId: "none" },
            { systemType: "source_control", providerId: "prov-github" },
          ],
        },
      });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INFRASTRUCTURE_PROVIDER_NONE_CONFLICT",
        details: { systemType: "source_control" },
      },
    });
  });

  it("rejects invalid marketing opt-out method codes", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          marketingOptOutMethod: "phone_call",
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
    const invalidTransferResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          transferMechanisms: ["not_a_real_mechanism"],
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

    const invalidRegionResponse = await saveProfileDraft(app, "org-test", {
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

    const invalidHostingRegionResponse = await saveProfileDraft(app, "org-test", {
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
    const invalidAccessResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        access: {
          ...profileBody.access,
          accessReviewCadence: "every_quarter",
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

    const invalidInfrastructureResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          atRestAlgorithm: "aes_512",
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

    const invalidMonitoringResponse = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          securityMonitoring: "outsourced",
        },
      });

    expect(invalidMonitoringResponse.statusCode).toBe(400);
    expect(invalidMonitoringResponse.json()).toMatchObject({
      error: {
        code: "CODE_NOT_FOUND",
        details: {
          codeSetId: "security_monitoring_modes",
          field: "infrastructure.securityMonitoring",
          value: "outsourced",
        },
      },
    });
  });

  it("returns structured validation errors", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        company: { ...profileBody.company, companyName: "" },
      });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects unknown controlled codes and countries", async () => {
    const app = await createTestApp();
    const response = await saveProfileDraft(app, "org-test", {
        ...profileBody,
        company: {
          ...profileBody.company,
          country: "ZZ",
        },
      });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("COUNTRY_NOT_FOUND");
  });
});
