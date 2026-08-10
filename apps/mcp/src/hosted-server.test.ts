import { once } from "node:events"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { describe, expect, it, vi } from "vitest"

import { createHostedMcpHttpServer } from "./hosted-server.js"

const listen = async (fetchFn: typeof fetch = vi.fn()) => {
  const server = createHostedMcpHttpServer({
    apiUrl: "https://api.plyco.example",
    fetchFn,
  })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  const address = server.address()
  if (!address || typeof address === "string") {
    throw new Error("Expected an HTTP server address")
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  }
}

describe("hosted MCP server", () => {
  it("serves a health check", async () => {
    const { server, url } = await listen()

    try {
      const response = await fetch(`${url}/health`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ status: "ok" })
    } finally {
      server.close()
    }
  })

  it("requires a bearer credential", async () => {
    const { server, url } = await listen()

    try {
      const response = await fetch(`${url}/organizations/org-123/mcp`, {
        method: "POST",
      })
      expect(response.status).toBe(401)
      expect(response.headers.get("www-authenticate")).toBe("Bearer")
    } finally {
      server.close()
    }
  })

  it("uses request-scoped credentials and organization context", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ organization: { id: "org/with spaces" } }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as unknown as typeof fetch
    const { server, url } = await listen(fetchFn)
    const transport = new StreamableHTTPClientTransport(
      new URL(`${url}/organizations/org%2Fwith%20spaces/mcp`),
      {
        requestInit: {
          headers: { Authorization: "Bearer plyco_org_hosted_secret" },
        },
      },
    )
    const client = new Client({ name: "hosted-test", version: "0.0.0" })

    try {
      await client.connect(transport)
      const { tools } = await client.listTools()
      expect(tools).toContainEqual(
        expect.objectContaining({
          name: "get_organization_overview",
          annotations: expect.objectContaining({ readOnlyHint: true }),
        }),
      )

      const result = await client.callTool({
        name: "get_organization_overview",
        arguments: {},
      })
      expect(result.structuredContent).toEqual({
        data: { organization: { id: "org/with spaces" } },
      })

      const request = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
        .calls[0]!
      expect((request[0] as URL).toString()).toBe(
        "https://api.plyco.example/organizations/org%2Fwith%20spaces",
      )
      expect((request[1] as RequestInit).headers).toMatchObject({
        Authorization: "Bearer plyco_org_hosted_secret",
      })
    } finally {
      await client.close()
      server.close()
    }
  })
})
