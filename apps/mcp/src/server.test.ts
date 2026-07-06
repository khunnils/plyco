import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { describe, expect, it, vi } from "vitest"

import { createApiClient } from "./api.js"
import { type McpConfig } from "./config.js"
import { createMcpServer } from "./server.js"

const config: McpConfig = {
  apiUrl: "https://api.plyco.example",
  apiKey: "plyco_org_secret",
  organizationId: "org-123",
}

const connectClient = async (fetchFn: typeof fetch) => {
  const api = createApiClient(config, fetchFn)
  const server = createMcpServer(config, api)
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: "test", version: "0.0.0" })
  await client.connect(clientTransport)

  return client
}

describe("plyco MCP server", () => {
  it("exposes the read-only workspace tools", async () => {
    const client = await connectClient(vi.fn())
    const { tools } = await client.listTools()

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_access_profile",
      "get_activities",
      "get_company_profile",
      "get_data_types",
      "get_document",
      "get_infrastructure_profile",
      "get_organization_overview",
      "get_organization_providers",
      "get_privacy_profile",
      "get_recommendations",
      "get_security_profile",
      "get_service_provider_usage",
      "get_services",
      "get_vocabulary",
      "list_documents",
      "list_templates",
    ])
  })

  it("calls the organization overview route with a bearer token", async () => {
    const overview = { organization: { id: "org-123" } }
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify(overview), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch
    const client = await connectClient(fetchFn)

    const result = await client.callTool({
      name: "get_organization_overview",
      arguments: {},
    })

    const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!
    const requestUrl = request[0] as URL
    const requestInit = request[1] as RequestInit
    expect(requestUrl.toString()).toBe(
      "https://api.plyco.example/organizations/org-123",
    )
    expect(
      (requestInit.headers as Record<string, string>).Authorization,
    ).toBe("Bearer plyco_org_secret")

    const content = result.content as Array<{ type: string; text: string }>
    expect(JSON.parse(content[0]!.text)).toEqual(overview)
  })

  it.each([
    ["get_company_profile", "/profile"],
    ["get_services", "/services"],
    ["get_privacy_profile", "/privacy"],
    ["get_infrastructure_profile", "/infrastructure"],
    ["get_security_profile", "/security"],
    ["get_access_profile", "/access"],
    ["get_activities", "/business-activities"],
    ["get_organization_providers", "/organization-providers"],
    ["get_service_provider_usage", "/service-provider-usage"],
  ])("maps %s to its organization route", async (toolName, suffix) => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch
    const client = await connectClient(fetchFn)

    await client.callTool({
      name: toolName,
      arguments: {},
    })

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      `https://api.plyco.example/organizations/org-123${suffix}`,
    )
  })

  it("returns only stored data types from the data profile", async () => {
    const dataTypes = [{ id: "data-1", name: "Email address" }]
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ dataTypesStored: dataTypes }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch
    const client = await connectClient(fetchFn)

    const result = await client.callTool({
      name: "get_data_types",
      arguments: {},
    })

    const requestUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as URL
    expect(requestUrl.toString()).toBe(
      "https://api.plyco.example/organizations/org-123/data",
    )

    const content = result.content as Array<{ type: string; text: string }>
    expect(JSON.parse(content[0]!.text)).toEqual(dataTypes)
  })
})
