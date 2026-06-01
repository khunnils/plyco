import { describe, expect, it } from "vitest";

import { createApp, createTestApp } from "../src/app.js";
import { LlmOrganizationLookupService } from "../src/features/organization-lookup/service.js";
import { ApiError } from "../src/infrastructure/errors.js";
import { type LlmJsonClient } from "../src/infrastructure/llm-client.js";
import { type PromptClient } from "../src/infrastructure/prompt-client.js";
import {
  authConfig,
  createInMemoryRepositories,
  profileBody,
  serviceBody,
  vendorBody,
  vendorUseBody,
} from "./helpers.js";

class CapturingPromptClient implements PromptClient {
  variables: Record<string, unknown> | null = null;

  async compilePrompt(name: string, variables: Record<string, unknown>) {
    this.variables = variables;

    return {
      content: "website parser prompt",
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

const lookupCrawler = {
  async crawl() {
    return {
      pages: [
        {
          url: "https://acme.example",
          title: "Acme AI",
          markdown:
            "Acme AI builds secure SaaS products for customers pursuing SOC 2 and GDPR.",
        },
      ],
      policyLinks: [
        {
          type: "privacy_policy" as const,
          title: "Privacy Policy",
          url: "https://acme.example/privacy",
        },
      ],
    };
  },
};

const validLookupResult = {
  company: profileBody.company,
  primaryService: serviceBody,
  primaryDataType: profileBody.dataHandling.dataTypesStored[0],
  primaryActivity: {
    name: "Account management",
    purpose: "Create and manage customer accounts.",
    role: "controller",
    legalBasis: ["contract"],
    retentionPolicy: null,
    retentionDays: 0,
  },
  suggestedProviders: [],
  policyLinks: [],
  warnings: [],
};

describe("organizations API", () => {
  it("requires authentication for organization lookup when auth is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      organizationLookupService: {
        async lookup() {
          throw new Error("should not be called");
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup",
      payload: { name: "Acme AI", website: "https://acme.example" },
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
        async lookup() {
          throw new Error("should not be called");
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup",
      payload: { name: "Acme AI", website: "not-a-url" },
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
        async lookup(input) {
          return {
            company: {
              ...profileBody.company,
              companyName: input.name,
              website: input.website,
            },
            primaryService: serviceBody,
            primaryDataType: profileBody.dataHandling.dataTypesStored[0],
            primaryActivity: {
              name: "Account management",
              purpose: "Create and manage customer accounts.",
              role: "",
              legalBasis: [],
              retentionPolicy: null,
              retentionDays: 0,
            },
            suggestedProviders: [
              { name: "GitHub", url: "https://github.com" },
            ],
            policyLinks: [
              {
                type: "privacy_policy",
                title: "Privacy Policy",
                url: "https://acme.example/privacy",
              },
            ],
            warnings: [],
          };
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup",
      payload: { name: "Acme Lookup", website: "https://acme.example" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      company: {
        companyName: "Acme Lookup",
        website: "https://acme.example",
      },
      primaryService: serviceBody,
      suggestedProviders: [{ name: "GitHub", url: "https://github.com" }],
    });
  });

  it("returns structured errors when organization lookup fails upstream", async () => {
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      organizationLookupService: {
        async lookup() {
          throw new ApiError(
            "ORGANIZATION_LOOKUP_AGENT_FAILED",
            "Organization lookup agent failed.",
            502,
          );
        },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/organization-lookup",
      payload: { name: "Acme AI", website: "https://acme.example" },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      error: { code: "ORGANIZATION_LOOKUP_AGENT_FAILED" },
    });
  });

  it("passes allowed vocabulary code ids to the organization lookup prompt", async () => {
    const promptClient = new CapturingPromptClient();
    const llmClient = new StubLlmClient(validLookupResult);
    const service = new LlmOrganizationLookupService(
      lookupCrawler,
      promptClient,
      llmClient,
      "test-model",
    );

    await service.lookup({
      name: "Acme AI",
      website: "https://acme.example",
    });

    const promptInput = promptClient.variables?.input as
      | { codeSets?: Record<string, Array<{ codeId: string; label: string }>> }
      | undefined;

    expect(promptInput?.codeSets?.compliance_goals).toContainEqual({
      codeId: "gdpr",
      label: "GDPR",
    });
    expect(promptInput?.codeSets?.industries).toContainEqual({
      codeId: "technology_saas",
      label: "Technology / SaaS",
    });
    expect(promptInput?.codeSets?.activity_role).toContainEqual({
      codeId: "controller",
      label: "Controller",
    });
  });

  it("constrains organization lookup schema fields to code ids", async () => {
    const llmClient = new StubLlmClient(validLookupResult);
    const service = new LlmOrganizationLookupService(
      lookupCrawler,
      new CapturingPromptClient(),
      llmClient,
      "test-model",
    );

    await service.lookup({
      name: "Acme AI",
      website: "https://acme.example",
    });

    const schema = llmClient.request?.responseSchema as {
      properties: Record<string, { properties: Record<string, unknown> }>;
    };
    const company = schema.properties.company.properties as Record<string, any>;
    const primaryActivity = schema.properties.primaryActivity
      .properties as Record<string, any>;

    expect(company.complianceGoals.items.enum).toContain("gdpr");
    expect(company.complianceGoals.items.enum).not.toContain("GDPR");
    expect(company.industries.items.enum).toContain("technology_saas");
    expect(primaryActivity.role.enum).toContain("controller");
    expect(primaryActivity.role.nullable).toBe(true);
    expect(primaryActivity.role.enum).not.toContain("Controller");
    expect(primaryActivity.role.enum).not.toContain("");
    expect(primaryActivity.legalBasis.items.enum).toContain("contract");
  });

  it("accepts null optional activity role from organization lookup", async () => {
    const service = new LlmOrganizationLookupService(
      lookupCrawler,
      new CapturingPromptClient(),
      new StubLlmClient({
        ...validLookupResult,
        primaryActivity: {
          ...validLookupResult.primaryActivity,
          role: null,
        },
      }),
      "test-model",
    );

    const result = await service.lookup({
      name: "Acme AI",
      website: "https://acme.example",
    });

    expect(result.primaryActivity.role).toBe("");
  });

  it("rejects organization lookup label values instead of normalizing them", async () => {
    const service = new LlmOrganizationLookupService(
      lookupCrawler,
      new CapturingPromptClient(),
      new StubLlmClient({
        ...validLookupResult,
        company: {
          ...validLookupResult.company,
          complianceGoals: ["GDPR"],
        },
        primaryActivity: {
          ...validLookupResult.primaryActivity,
          role: "Controller",
        },
      }),
      "test-model",
    );

    await expect(
      service.lookup({
        name: "Acme AI",
        website: "https://acme.example",
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_LOOKUP_INVALID_RESPONSE",
    });
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
});
