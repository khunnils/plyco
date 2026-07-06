import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { type ApiClient } from "./api.js"
import { type McpConfig } from "./config.js"

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

  const registerOrganizationGetTool = (
    name: string,
    title: string,
    description: string,
    suffix: string,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema: {},
      },
      async () => jsonResult(await api.getJson(orgPath(suffix))),
    )

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

  registerOrganizationGetTool(
    "get_company_profile",
    "Get company profile",
    "Returns the organization's company profile.",
    "/profile",
  )

  registerOrganizationGetTool(
    "get_services",
    "Get services",
    "Returns the organization's services.",
    "/services",
  )

  server.registerTool(
    "get_data_types",
    {
      title: "Get data types",
      description: "Returns the organization's stored data types.",
      inputSchema: {},
    },
    async () => {
      const dataHandling = (await api.getJson(orgPath("/data"))) as {
        dataTypesStored?: unknown
      }

      return jsonResult(dataHandling.dataTypesStored ?? [])
    },
  )

  registerOrganizationGetTool(
    "get_privacy_profile",
    "Get privacy profile",
    "Returns the organization's privacy profile.",
    "/privacy",
  )

  registerOrganizationGetTool(
    "get_infrastructure_profile",
    "Get infrastructure profile",
    "Returns the organization's infrastructure profile.",
    "/infrastructure",
  )

  registerOrganizationGetTool(
    "get_security_profile",
    "Get security profile",
    "Returns the organization's security profile.",
    "/security",
  )

  registerOrganizationGetTool(
    "get_access_profile",
    "Get access profile",
    "Returns the organization's access profile.",
    "/access",
  )

  registerOrganizationGetTool(
    "get_activities",
    "Get activities",
    "Returns the organization's business activities.",
    "/business-activities",
  )

  registerOrganizationGetTool(
    "get_organization_providers",
    "Get organization providers",
    "Returns the organization's provider inventory.",
    "/organization-providers",
  )

  registerOrganizationGetTool(
    "get_service_provider_usage",
    "Get service provider usage",
    "Returns the organization's service provider usage.",
    "/service-provider-usage",
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
