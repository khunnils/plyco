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
    dataTypesStored: ["customer account data", "product analytics"],
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
  dataProcessed: ["source code", "user emails"],
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

    const getResponse = await app.inject({
      method: "GET",
      url: "/security-profile",
    })

    expect(getResponse.statusCode).toBe(200)
    expect(getResponse.json().organization.company.companyName).toBe("Acme AI")
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
          { status: 401, statusText: "Unauthorized" }
        )
      })
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
