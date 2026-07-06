import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { type ApiClient } from "./api.js"
import { type McpConfig } from "./config.js"

// Maps a friendly profile section name to its organization-scoped GET route.
const PROFILE_SECTION_ROUTES = {
  company: "profile",
  services: "services",
  data: "data",
  privacy: "privacy",
  infrastructure: "infrastructure",
  security: "security",
  access: "access",
} as const

type ProfileSection = keyof typeof PROFILE_SECTION_ROUTES

const jsonResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
})

export function createMcpServer(
  config: McpConfig,
  api: ApiClient,
): McpServer {
  const server = new McpServer({
    name: "plyco-mcp",
    version: "0.0.1",
  })

  const orgPath = (suffix = "") =>
    `/organizations/${encodeURIComponent(config.organizationId)}${suffix}`

  server.registerTool(
    "get_organization_overview",
    {
      title: "Get organization overview",
      description:
        "Returns the organization profile snapshot: company profile, services, business activities, provider inventory, and service provider usage.",
      inputSchema: {},
    },
    async () => jsonResult(await api.getJson(orgPath())),
  )

  server.registerTool(
    "get_profile_section",
    {
      title: "Get a profile section",
      description:
        "Returns a single compliance profile section for the organization.",
      inputSchema: {
        section: z
          .enum(
            Object.keys(PROFILE_SECTION_ROUTES) as [
              ProfileSection,
              ...ProfileSection[],
            ],
          )
          .describe("Which profile section to fetch."),
      },
    },
    async ({ section }) =>
      jsonResult(
        await api.getJson(orgPath(`/${PROFILE_SECTION_ROUTES[section]}`)),
      ),
  )

  server.registerTool(
    "get_recommendations",
    {
      title: "Get advisor recommendations",
      description:
        "Returns the current advisor recommendations computed from the organization profile.",
      inputSchema: {},
    },
    async () => jsonResult(await api.getJson(orgPath("/recommendations"))),
  )

  server.registerTool(
    "get_vocabulary",
    {
      title: "Get controlled vocabulary",
      description:
        "Returns the organization's controlled vocabulary code sets and codes.",
      inputSchema: {},
    },
    async () => jsonResult(await api.getJson(orgPath("/vocabulary"))),
  )

  server.registerTool(
    "list_templates",
    {
      title: "List document templates",
      description: "Returns the organization's document templates.",
      inputSchema: {},
    },
    async () => jsonResult(await api.getJson(orgPath("/templates"))),
  )

  server.registerTool(
    "list_documents",
    {
      title: "List generated documents",
      description: "Returns summaries of the organization's generated documents.",
      inputSchema: {},
    },
    async () => jsonResult(await api.getJson(orgPath("/documents"))),
  )

  server.registerTool(
    "get_document",
    {
      title: "Get a generated document",
      description:
        "Returns a single generated document, including its rendered markdown content.",
      inputSchema: {
        documentId: z.string().min(1).describe("The document ID."),
      },
    },
    async ({ documentId }) =>
      jsonResult(
        await api.getJson(orgPath(`/documents/${encodeURIComponent(documentId)}`)),
      ),
  )

  return server
}
