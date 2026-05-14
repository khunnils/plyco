import { afterEach, describe, expect, it, vi } from "vitest"

import { createApp, createTestApp } from "../src/app.js"
import { readAuthConfig } from "../src/config.js"
import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js"
import { InMemoryDocumentRepository } from "../src/features/documents/in-memory-repository.js"
import { InMemoryOrganizationRepository } from "../src/features/organizations/in-memory-repository.js"
import { InMemoryVendorRepository } from "../src/features/vendors/in-memory-repository.js"
import { AirtableProviderSource } from "../src/providers.js"

const profileBody = {
  company: {
    companyName: "Acme AI",
    employeeCount: 12,
    industries: ["AI", "SaaS"],
    regions: ["US", "EU"],
    handlesPii: true,
    handlesSensitiveData: true,
    complianceGoals: ["SOC 2", "GDPR"],
  },
  infrastructure: {
    organizationProviders: [
      {
        systemType: "source-control",
        providerId: "prov-github",
      },
    ],
    mfaEnabled: true,
    encryptedDevicesRequired: true,
    backupsEnabled: true,
    centralizedLoggingEnabled: false,
  },
  dataHandling: {
    dataTypesStored: [
      {
        name: "customer account data",
        isSensitive: true,
        description: "Profile and billing contact details",
      },
      {
        name: "product analytics",
        isSensitive: false,
        description: "Usage events for product improvement",
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
    privilegedAccessRestricted: true,
  },
}

const vendorBody = {
  name: "GitHub",
  category: "Source control",
  purpose: "Code hosting and pull requests",
  hasSubprocessors: true,
  dataProcessingLevel: "limited",
  dataProcessed: ["customer account data"],
  dpaStatus: "signed",
  dataRegions: ["US"],
  criticality: "high",
  owner: "Engineering",
  notes: "Critical engineering system",
}

const authConfig = {
  apiPublicUrl: "http://localhost:4000",
  clientUrl: "http://localhost:5173",
  googleClientId: "google-client-id",
  googleClientSecret: "google-client-secret",
  sessionKey: "test-session-key-with-at-least-32-chars",
  cookieSecure: false,
  cookieSameSite: "lax" as const,
}

describe("security profile API", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns health status", async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: "GET", url: "/health" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: "ok" })
  })

  it("rejects protected routes when authentication is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    })
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    })
  })

  it("returns anonymous auth state before login", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    })
    const response = await app.inject({ method: "GET", url: "/auth/me" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ user: null, organizations: [] })
  })

  it("supports idempotent logout without a session", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    })
    const response = await app.inject({ method: "POST", url: "/auth/logout" })

    expect(response.statusCode).toBe(204)
  })

  it("clears stale authenticated sessions whose user no longer exists", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    })

    const staleCookieResponse = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: {
        cf_session:
          "Fe26.2**stale-session-cookie-placeholder**placeholder",
      },
    })

    expect(staleCookieResponse.statusCode).toBe(200)
  })

  it("requires auth config values when auth config is read", () => {
    expect(() => readAuthConfig({} as NodeJS.ProcessEnv)).toThrow(
      "SESSION_KEY is required",
    )
  })

  it("requires a high entropy session key", () => {
    expect(() =>
      readAuthConfig({
        SESSION_KEY: "short",
        API_PUBLIC_URL: "http://localhost:4000",
        CLIENT_URL: "http://localhost:5173",
        GOOGLE_OAUTH_CLIENT_ID: "client",
        GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      } as NodeJS.ProcessEnv),
    ).toThrow("SESSION_KEY must be at least 32 characters")
  })

  it("creates and returns the single organization security profile", async () => {
    const app = await createTestApp()
    const saveResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    })

    expect(saveResponse.statusCode).toBe(200)
    expect(saveResponse.json().organization.company.companyName).toBe("Acme AI")
    expect(
      saveResponse.json().organization.dataHandling.dataTypesStored,
    ).toEqual(profileBody.dataHandling.dataTypesStored)

    const getResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    })

    expect(getResponse.statusCode).toBe(200)
    expect(getResponse.json().organization.company.companyName).toBe("Acme AI")
    expect(
      getResponse.json().organization.dataHandling.dataTypesStored,
    ).toEqual(profileBody.dataHandling.dataTypesStored)
  })

  it("returns structured validation errors", async () => {
    const app = await createTestApp()
    const response = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        company: { ...profileBody.company, companyName: "" },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe("VALIDATION_FAILED")
  })

  it("supports vendor CRUD", async () => {
    const app = await createTestApp()
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    })

    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vendors",
      payload: vendorBody,
    })

    expect(createResponse.statusCode).toBe(201)
    const createdVendor = createResponse.json()
    expect(createdVendor.name).toBe("GitHub")

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/vendors/${createdVendor.id}`,
      payload: {
        ...vendorBody,
        dpaStatus: "in_review",
        notes: "DPA being reviewed",
      },
    })

    expect(updateResponse.statusCode).toBe(200)
    expect(updateResponse.json().dpaStatus).toBe("in_review")

    const listResponse = await app.inject({ method: "GET", url: "/organizations/org-test/vendors" })
    expect(listResponse.json()).toHaveLength(1)

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/organizations/org-test/vendors/${createdVendor.id}`,
    })
    expect(deleteResponse.statusCode).toBe(204)

    const emptyListResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vendors",
    })
    expect(emptyListResponse.json()).toHaveLength(0)
  })

  it("returns system and organization templates", async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: "GET", url: "/organizations/org-test/templates" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      systemTemplates: [
        {
          slug: "incident-response-plan",
          name: "Incident Response Plan",
          description: "A lightweight incident response outline.",
        },
        {
          slug: "security-policy",
          name: "Security Policy",
          description: "A practical starter security policy.",
        },
      ],
      organizationTemplates: [],
    })
  })

  it("copies, edits, and deletes organization templates", async () => {
    const app = await createTestApp()
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "security-policy" },
    })

    expect(createResponse.statusCode).toBe(201)
    const createdTemplate = createResponse.json()
    expect(createdTemplate).toMatchObject({
      name: "Security Policy",
      slug: "security-policy",
      sourceSystemTemplateSlug: "security-policy",
      content: "# {{ company.name }} Security Policy\n",
    })

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
      payload: {
        name: "Customer Security Policy",
        slug: "customer-security-policy",
        content: "# Updated policy\n",
      },
    })

    expect(updateResponse.statusCode).toBe(200)
    expect(updateResponse.json()).toMatchObject({
      name: "Customer Security Policy",
      slug: "customer-security-policy",
      sourceSystemTemplateSlug: "security-policy",
      content: "# Updated policy\n",
    })

    const listResponse = await app.inject({ method: "GET", url: "/organizations/org-test/templates" })
    expect(listResponse.json().organizationTemplates).toHaveLength(1)

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
    })
    expect(deleteResponse.statusCode).toBe(204)
  })

  it("rejects missing system templates", async () => {
    const app = await createTestApp()
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "missing-template" },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe("SYSTEM_TEMPLATE_NOT_FOUND")
  })

  it("generates documents from templates and reports stale documents", async () => {
    const app = await createTestApp()
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    })
    const createTemplateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "security-policy" },
    })
    const template = createTemplateResponse.json()

    const emptyDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    })
    expect(emptyDocumentsResponse.statusCode).toBe(200)
    expect(emptyDocumentsResponse.json()).toMatchObject([
      {
        template: { id: template.id, slug: "security-policy" },
        document: null,
        status: "not_generated",
      },
    ])

    const generateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    })

    expect(generateResponse.statusCode).toBe(201)
    expect(generateResponse.json()).toMatchObject({
      templateId: template.id,
      title: "Security Policy",
      renderedContent: "# Acme AI Security Policy\n",
    })
    expect(generateResponse.json().sourceHash).toHaveLength(64)

    const currentDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    })
    expect(currentDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ])

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    })
    expect(duplicateResponse.statusCode).toBe(409)
    expect(duplicateResponse.json().error.code).toBe("DOCUMENT_ALREADY_EXISTS")

    const documentResponse = await app.inject({
      method: "GET",
      url: `/organizations/org-test/documents/${generateResponse.json().id}`,
    })
    expect(documentResponse.statusCode).toBe(200)
    expect(documentResponse.json().renderedContent).toBe(
      "# Acme AI Security Policy\n",
    )

    await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Security Policy",
        slug: "security-policy",
        content: "# Updated {{ company.name }} Security Policy\n",
      },
    })

    const staleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    })
    expect(staleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ])
  })

  it("rejects document generation for missing templates", async () => {
    const app = await createTestApp()
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: "template_missing" },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe("TEMPLATE_NOT_FOUND")
  })

  it("rejects vendor data processed outside organization data types", async () => {
    const app = await createTestApp()
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    })

    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vendors",
      payload: {
        ...vendorBody,
        dataProcessed: ["source code"],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: {
        code: "VENDOR_DATA_TYPE_NOT_FOUND",
        details: { dataProcessed: ["source code"] },
      },
    })
  })

  it("returns provider catalog entries", async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: "GET", url: "/providers" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      {
        id: "prov-github",
        name: "GitHub",
        url: "https://github.com",
        category: "Source Control",
        systemTypes: ["source-control"],
        securityCriticality: "Critical",
        handlesCustomerData: false,
      },
    ])
  })

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
        )
      }),
    )
    const app = await createApp({
      auth: false,
      ...createInMemoryRepositories(),
      providerSource: new AirtableProviderSource("app-test", "pat-test"),
    })
    const response = await app.inject({ method: "GET", url: "/providers" })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({
      error: {
        code: "PROVIDER_CATALOG_LOAD_FAILED",
        details: {
          status: 401,
          statusText: "Unauthorized",
        },
      },
    })
  })

  it("logs unexpected request failures with error details", async () => {
    let logOutput = ""
    const app = await createApp({
      auth: false,
      logger: {
        level: "error",
        stream: {
          write(chunk) {
            logOutput += chunk
          },
        },
      },
      ...createInMemoryRepositories(),
      providerSource: {
        async listProviders() {
          throw new Error("catalog exploded")
        },
      },
    })
    const response = await app.inject({ method: "GET", url: "/providers" })

    expect(response.statusCode).toBe(500)
    expect(logOutput).toContain("request failed")
    expect(logOutput).toContain("catalog exploded")
    expect(logOutput).toContain("/providers")
  })
})

function createInMemoryRepositories() {
  const accountRepository = new InMemoryAccountRepository()
  const organizationRepository = new InMemoryOrganizationRepository()

  return {
    accountRepository,
    documentRepository: new InMemoryDocumentRepository(organizationRepository),
    organizationRepository,
    vendorRepository: new InMemoryVendorRepository(organizationRepository),
  }
}
