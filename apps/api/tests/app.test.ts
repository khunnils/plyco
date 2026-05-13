import { afterEach, describe, expect, it, vi } from "vitest"

import { createApp, createTestApp } from "../src/app.js"
import { AirtableProviderSource } from "../src/providers.js"
import { InMemorySecurityProfileRepository } from "../src/repository.js"

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
    cloudProviders: ["AWS"],
    sourceControlProvider: "GitHub",
    authProvider: "Google Workspace",
    passwordManager: "1Password",
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

  it("creates and returns the single organization security profile", async () => {
    const app = await createTestApp()
    const saveResponse = await app.inject({
      method: "PUT",
      url: "/security-profile",
      payload: profileBody,
    })

    expect(saveResponse.statusCode).toBe(200)
    expect(saveResponse.json().organization.company.companyName).toBe("Acme AI")
    expect(
      saveResponse.json().organization.dataHandling.dataTypesStored,
    ).toEqual(profileBody.dataHandling.dataTypesStored)

    const getResponse = await app.inject({
      method: "GET",
      url: "/security-profile",
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
      url: "/security-profile",
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
      url: "/security-profile",
      payload: profileBody,
    })

    const createResponse = await app.inject({
      method: "POST",
      url: "/vendors",
      payload: vendorBody,
    })

    expect(createResponse.statusCode).toBe(201)
    const createdVendor = createResponse.json()
    expect(createdVendor.name).toBe("GitHub")

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/vendors/${createdVendor.id}`,
      payload: {
        ...vendorBody,
        dpaStatus: "in_review",
        notes: "DPA being reviewed",
      },
    })

    expect(updateResponse.statusCode).toBe(200)
    expect(updateResponse.json().dpaStatus).toBe("in_review")

    const listResponse = await app.inject({ method: "GET", url: "/vendors" })
    expect(listResponse.json()).toHaveLength(1)

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/vendors/${createdVendor.id}`,
    })
    expect(deleteResponse.statusCode).toBe(204)

    const emptyListResponse = await app.inject({
      method: "GET",
      url: "/vendors",
    })
    expect(emptyListResponse.json()).toHaveLength(0)
  })

  it("returns system and organization templates", async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: "GET", url: "/templates" })

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
      url: "/templates/organization",
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
      url: `/templates/organization/${createdTemplate.id}`,
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

    const listResponse = await app.inject({ method: "GET", url: "/templates" })
    expect(listResponse.json().organizationTemplates).toHaveLength(1)

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/templates/organization/${createdTemplate.id}`,
    })
    expect(deleteResponse.statusCode).toBe(204)
  })

  it("rejects missing system templates", async () => {
    const app = await createTestApp()
    const response = await app.inject({
      method: "POST",
      url: "/templates/organization",
      payload: { sourceSystemTemplateSlug: "missing-template" },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe("SYSTEM_TEMPLATE_NOT_FOUND")
  })

  it("generates documents from templates and reports stale documents", async () => {
    const app = await createTestApp()
    await app.inject({
      method: "PUT",
      url: "/security-profile",
      payload: profileBody,
    })
    const createTemplateResponse = await app.inject({
      method: "POST",
      url: "/templates/organization",
      payload: { sourceSystemTemplateSlug: "security-policy" },
    })
    const template = createTemplateResponse.json()

    const emptyDocumentsResponse = await app.inject({
      method: "GET",
      url: "/documents",
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
      url: "/documents",
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
      url: "/documents",
    })
    expect(currentDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ])

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/documents",
      payload: { templateId: template.id },
    })
    expect(duplicateResponse.statusCode).toBe(409)
    expect(duplicateResponse.json().error.code).toBe("DOCUMENT_ALREADY_EXISTS")

    const documentResponse = await app.inject({
      method: "GET",
      url: `/documents/${generateResponse.json().id}`,
    })
    expect(documentResponse.statusCode).toBe(200)
    expect(documentResponse.json().renderedContent).toBe(
      "# Acme AI Security Policy\n",
    )

    await app.inject({
      method: "PUT",
      url: `/templates/organization/${template.id}`,
      payload: {
        name: "Security Policy",
        slug: "security-policy",
        content: "# Updated {{ company.name }} Security Policy\n",
      },
    })

    const staleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/documents",
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
      url: "/documents",
      payload: { templateId: "template_missing" },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe("TEMPLATE_NOT_FOUND")
  })

  it("rejects vendor data processed outside organization data types", async () => {
    const app = await createTestApp()
    await app.inject({
      method: "PUT",
      url: "/security-profile",
      payload: profileBody,
    })

    const response = await app.inject({
      method: "POST",
      url: "/vendors",
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
      repository: new InMemorySecurityProfileRepository(),
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
      logger: {
        level: "error",
        stream: {
          write(chunk) {
            logOutput += chunk
          },
        },
      },
      repository: new InMemorySecurityProfileRepository(),
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
