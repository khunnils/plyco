import { createServer, type IncomingMessage, type ServerResponse } from "node:http"

import { createOrgClient } from "@plyco/api-client"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

import { createMcpServer } from "./server.js"

export type HostedMcpServerOptions = {
  apiUrl: string
  allowedHosts?: string[]
  fetchFn?: typeof fetch
}

const organizationMcpPath = /^\/organizations\/([^/]+)\/mcp\/?$/

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: unknown,
) => {
  response.writeHead(statusCode, { "Content-Type": "application/json" })
  response.end(JSON.stringify(body))
}

const sendMcpError = (
  response: ServerResponse,
  statusCode: number,
  message: string,
  headers: Record<string, string> = {},
) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...headers,
  })
  response.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message },
      id: null,
    }),
  )
}

const bearerToken = (request: IncomingMessage) => {
  const [scheme, token, extra] =
    request.headers.authorization?.split(/\s+/) ?? []

  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    return null
  }

  return token
}

const requestHost = (request: IncomingMessage) => {
  const host = request.headers.host

  if (!host) {
    return null
  }

  try {
    return new URL(`http://${host}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

const organizationIdFromPath = (request: IncomingMessage) => {
  const pathname = new URL(request.url ?? "/", "http://plyco.local").pathname
  const encodedOrganizationId = organizationMcpPath.exec(pathname)?.[1]

  if (!encodedOrganizationId) {
    return null
  }

  try {
    return decodeURIComponent(encodedOrganizationId)
  } catch {
    return null
  }
}

export const createHostedMcpHttpServer = ({
  apiUrl,
  allowedHosts,
  fetchFn,
}: HostedMcpServerOptions) =>
  createServer(async (request, response) => {
    if (request.url === "/health" && request.method === "GET") {
      sendJson(response, 200, { status: "ok" })
      return
    }

    if (allowedHosts?.length) {
      const host = requestHost(request)

      if (!host || !allowedHosts.includes(host)) {
        sendMcpError(response, 403, "Host is not allowed.")
        return
      }
    }

    const organizationId = organizationIdFromPath(request)

    if (!organizationId) {
      sendMcpError(response, 404, "MCP endpoint not found.")
      return
    }

    if (request.method !== "POST") {
      sendMcpError(response, 405, "Method not allowed.", { Allow: "POST" })
      return
    }

    const apiKey = bearerToken(request)

    if (!apiKey) {
      sendMcpError(response, 401, "Authentication is required.", {
        "WWW-Authenticate": "Bearer",
      })
      return
    }

    const org = createOrgClient(
      { apiUrl, apiKey, organizationId },
      { fetchFn },
    )
    const server = createMcpServer(org)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(request, response)
    } catch {
      if (!response.headersSent) {
        sendMcpError(response, 500, "Internal MCP server error.")
      }
    } finally {
      await transport.close()
      await server.close()
    }
  })
