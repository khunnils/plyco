import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { describe, expect, it, vi } from "vitest"

import { createApiClient } from "./api.js"
import { type McpConfig } from "./config.js"
import { createMcpServer } from "./server.js"

const config: McpConfig = {
  apiUrl: "https://api.plyco.example",
  apiKey: "plyco_org_secret",
  organizationId: "org-123",
}

const connectClient = async (
  fetchFn: typeof fetch,
  currentConfig: McpConfig = config,
) => {
  const api = createApiClient(currentConfig, fetchFn)
  const server = createMcpServer(currentConfig, api)
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: "test", version: "0.0.0" })
  await client.connect(clientTransport)

  return client
}

const getFirstFetchRequest = (fetchFn: typeof fetch) => {
  const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
    .calls[0]!

  return {
    url: request[0] as URL,
    init: request[1] as RequestInit,
  }
}

const getTextContent = (result: CallToolResult) =>
  result.content as Array<{ type: string; text: string }>

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
    expect((requestInit.headers as Record<string, string>).Accept).toBe(
      "application/json",
    )

    const content = getTextContent(result as CallToolResult)
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

    const content = getTextContent(result as CallToolResult)
    expect(JSON.parse(content[0]!.text)).toEqual(dataTypes)
  })

  it("encodes organization and document IDs in API paths", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "doc/with spaces" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch
    const client = await connectClient(fetchFn, {
      ...config,
      organizationId: "org/with spaces",
    })

    await client.callTool({
      name: "get_document",
      arguments: { documentId: "doc/with spaces" },
    })

    const { url } = getFirstFetchRequest(fetchFn)
    expect(url.toString()).toBe(
      "https://api.plyco.example/organizations/org%2Fwith%20spaces/documents/doc%2Fwith%20spaces",
    )
  })

  it("returns API failures as MCP tool errors", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch
    const client = await connectClient(fetchFn)

    const result = (await client.callTool({
      name: "get_organization_overview",
      arguments: {},
    })) as CallToolResult

    expect(result.isError).toBe(true)
    const content = getTextContent(result)
    expect(content[0]!.text).toContain("Plyco API returned status 401")
  })
})
