import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { createApp, createTestApp } from "../src/app.js";
import { LlmProviderLookupService } from "../src/features/vendors/provider-lookup.js";
import { AirtableProviderSource } from "../src/infrastructure/providers.js";
import {
  AirtableProviderLookupCodeSource,
  StaticProviderLookupCodeSource,
} from "../src/infrastructure/airtable-code-source.js";
import {
  AirtableProviderImportClient,
  AirtableProviderImportService,
} from "../src/features/vendors/provider-import.js";

import {
  authConfig,
  createInMemoryRepositories,
  profileBody,
  providerLookupResult,
  vendorBody,
  vendorUseBody,
} from "./helpers.js";

class InMemoryAirtableImportClient extends AirtableProviderImportClient {
  records: Record<string, Array<{ id: string; fields: Record<string, unknown> }>>;

  constructor(
    records: Record<string, Array<{ id: string; fields: Record<string, unknown> }>> = {},
  ) {
    super("app-test", "pat-test");
    this.records = {
      Codes: [],
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

describe("vendors / providers API", () => {
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
      payload: {
        ...vendorBody,
        purpose: "Git hosting and collaboration",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdVendor = createResponse.json();
    expect(createdVendor.name).toBe("GitHub");
    expect(createdVendor.countryOfRegistration).toBe("US");
    expect(createdVendor.purpose).toBe("Git hosting and collaboration");

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

  it("loads provider lookup categories from standard Codes using provider_categories and system types from Codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const tableName = decodeURIComponent(
          new URL(String(input)).pathname.split("/").at(-1) ?? "",
        );
        const recordsByTable: Record<string, unknown[]> = {
          "Code Sets": [
            {
              id: "rec-system-types",
              fields: { Id: "provider_system_types" },
            },
            {
              id: "rec-vendor-categories",
              fields: { Id: "provider_categories" },
            },
          ],
          Codes: [
            {
              id: "rec-system-auth",
              fields: {
                Id: "auth",
                Name: "Auth",
                "Code Set": ["rec-system-types"],
              },
            },
            {
              id: "rec-stale-category",
              fields: {
                Id: "ai_provider",
                Name: "AI provider",
                "Code Set": ["rec-other-categories"],
              },
            },
            {
              id: "rec-ai",
              fields: {
                Id: "ai",
                Name: "AI",
                "Code Set": ["rec-vendor-categories"],
              },
            },
            {
              id: "rec-source",
              fields: {
                Id: "source-control",
                Name: "Source Control",
                "Code Set": ["rec-vendor-categories"],
              },
            },
          ],
        };

        return new Response(
          JSON.stringify({ records: recordsByTable[tableName] ?? [] }),
          { status: 200 },
        );
      }),
    );
    const source = new AirtableProviderLookupCodeSource("app-test", "pat-test");

    await expect(source.listLookupCodes()).resolves.toEqual({
      categories: [
        { code: "ai", name: "AI" },
        { code: "source-control", name: "Source Control" },
      ],
      systemTypes: [{ code: "auth", name: "Auth" }],
    });
  });

  it("passes Airtable lookup codes into the provider lookup prompt", async () => {
    let promptVariables: Record<string, string> | null = null;
    let generationInputVariables: Record<string, string> | undefined;
    let responseSchema: unknown = null;
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [{ code: "source-control", name: "Source control" }],
        systemTypes: [{ code: "source_control", name: "Source control" }],
      }),
      {
        async compilePrompt(_name, variables) {
          promptVariables = variables;
          return {
            content: "resolved prompt",
            inputVariables: variables,
            metadata: {
              name: "resolve_provider",
              version: 1,
              isFallback: false,
            },
          };
        },
      },
      {
        async generateJson(input) {
          generationInputVariables = input.prompt.inputVariables;
          responseSchema = input.responseSchema;
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
      "source-control",
    ]);
    expect(generationInputVariables).toEqual(promptVariables);
    expect(responseSchema).toMatchObject({
      properties: {
        provider: {
          properties: {
            category: { enum: ["source-control"] },
          },
        },
      },
    });
  });

  it("rejects provider lookup labels that are not Airtable code IDs", async () => {
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [
          { code: "ai", name: "AI" },
          { code: "source-control", name: "Source control" },
        ],
        systemTypes: [{ code: "source_control", name: "Source control" }],
      }),
      {
        async compilePrompt(_name, variables) {
          return {
            content: "resolved prompt",
            inputVariables: variables,
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
              category: "AI provider",
            },
          };
        },
      },
      "gemini-2.5-flash",
    );

    await expect(service.lookup("https://github.com")).rejects.toMatchObject({
      code: "PROVIDER_LOOKUP_UNKNOWN_CODE",
      details: {
        codeSetId: "provider_categories",
        field: "provider.category",
        value: "AI provider",
      },
    });
  });

  it("rejects invalid provider lookup JSON shapes", async () => {
    const service = new LlmProviderLookupService(
      new StaticProviderLookupCodeSource({
        categories: [{ code: "source-control", name: "Source control" }],
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
        categories: [{ code: "source-control", name: "Source control" }],
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
        codeSetId: "provider_categories",
        field: "provider.category",
        value: "unknown_category",
      },
    });
  });

  it("creates Airtable organization and provider records during provider import", async () => {
    const client = new InMemoryAirtableImportClient({
      Codes: [
        {
          id: "rec-category",
          fields: { Id: "source-control", Name: "Source Control" },
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
      "System Type": null,
      "Security Relevance": "Critical",
      "Handles Customer Data": false,
      Organizatzion: [result.organizationRecordId],
      Category: ["rec-category"],
    });
  });

  it("updates existing Airtable organization and provider records during provider import", async () => {
    const client = new InMemoryAirtableImportClient({
      Codes: [
        {
          id: "rec-category",
          fields: { Id: "source-control", Name: "Source Control" },
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
    const client = new InMemoryAirtableImportClient();
    const service = new AirtableProviderImportService(
      {
        async lookup() {
          return providerLookupResult;
        },
      },
      client,
    );

    await expect(service.importProvider("https://github.com")).rejects.toMatchObject({
      code: "PROVIDER_IMPORT_CATEGORY_NOT_FOUND",
      statusCode: 400,
      details: { category: "source-control" },
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
});
