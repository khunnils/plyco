import { describe, expect, it, vi } from "vitest"

import { ApiResponseError } from "./api.js"
import { createOrgClient } from "./client.js"
import { type OrgClientConfig } from "./config.js"

const config: OrgClientConfig = {
  apiUrl: "https://api.plyco.example",
  apiKey: "plyco_org_secret",
  organizationId: "org-123",
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

describe("createOrgClient", () => {
  it("calls the organization overview route with a bearer token", async () => {
    const overview = { organization: { id: "org-123" } }
    const fetchFn = vi.fn(async () => jsonResponse(overview)) as unknown as typeof fetch
    const client = createOrgClient(config, { fetchFn })

    await expect(client.getOverview()).resolves.toEqual(overview)

    const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!
    expect((request[0] as URL).toString()).toBe(
      "https://api.plyco.example/organizations/org-123",
    )
    expect((request[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer plyco_org_secret",
      Accept: "application/json",
    })
  })

  it.each([
    ["getProfile", "/profile"],
    ["getServices", "/services"],
    ["getPrivacyProfile", "/privacy"],
    ["getInfrastructureProfile", "/infrastructure"],
    ["getSecurityProfile", "/security"],
    ["getAccessProfile", "/access"],
    ["getActivities", "/business-activities"],
    ["getOrganizationProviders", "/organization-providers"],
    ["getServiceProviderUsage", "/service-provider-usage"],
    ["getRecommendations", "/recommendations"],
    ["getVocabulary", "/vocabulary"],
    ["listTemplates", "/templates"],
    ["listDocuments", "/documents"],
  ] as const)("maps %s to its organization route", async (method, suffix) => {
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true })) as unknown as typeof fetch
    const client = createOrgClient(config, { fetchFn })

    await client[method]()

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      `https://api.plyco.example/organizations/org-123${suffix}`,
    )
  })

  it("returns only stored data types from the data profile", async () => {
    const dataTypes = [{ id: "data-1", name: "Email address" }]
    const fetchFn = vi.fn(async () =>
      jsonResponse({ dataTypesStored: dataTypes }),
    ) as unknown as typeof fetch
    const client = createOrgClient(config, { fetchFn })

    await expect(client.getDataTypes()).resolves.toEqual(dataTypes)

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      "https://api.plyco.example/organizations/org-123/data",
    )
  })

  it("encodes organization and document IDs in API paths", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ id: "doc/with spaces" }),
    ) as unknown as typeof fetch
    const client = createOrgClient(
      { ...config, organizationId: "org/with spaces" },
      { fetchFn },
    )

    await client.getDocument("doc/with spaces")

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      "https://api.plyco.example/organizations/org%2Fwith%20spaces/documents/doc%2Fwith%20spaces",
    )
  })

  it("throws ApiResponseError on non-2xx responses", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401),
    ) as unknown as typeof fetch
    const client = createOrgClient(config, { fetchFn })

    await expect(client.getOverview()).rejects.toBeInstanceOf(ApiResponseError)
  })
})
