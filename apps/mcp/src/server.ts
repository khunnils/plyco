import { type OrgClient } from "@plyco/api-client"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const jsonResult = (data: unknown) => ({
  structuredContent: { data },
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
})

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const

export function createMcpServer(org: OrgClient): McpServer {
  const server = new McpServer(
    {
      name: "plyco-mcp",
      version: "0.1.0",
    },
    {
      instructions:
        "Use Plyco as the authoritative record of how the connected organization currently operates. All tools are read-only. Plyco data supports compliance readiness work but is not certification or legal advice.",
    },
  )

  const registerGetTool = (
    name: string,
    title: string,
    description: string,
    invoke: () => Promise<unknown>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema: {},
        outputSchema: { data: z.unknown() },
        annotations: readOnlyAnnotations,
      },
      async () => jsonResult(await invoke()),
    )

  registerGetTool(
    "get_organization_overview",
    "Get organization overview",
    "Returns the organization profile snapshot: company profile, services, business activities, provider inventory, and service provider usage.",
    () => org.getOverview(),
  )

  registerGetTool(
    "get_company_profile",
    "Get company profile",
    "Returns the organization's company profile.",
    () => org.getProfile(),
  )

  registerGetTool(
    "get_services",
    "Get services",
    "Returns the organization's services.",
    () => org.getServices(),
  )

  registerGetTool(
    "get_data_types",
    "Get data types",
    "Returns the organization's stored data types.",
    () => org.getDataTypes(),
  )

  registerGetTool(
    "get_privacy_profile",
    "Get privacy profile",
    "Returns the organization's privacy profile.",
    () => org.getPrivacyProfile(),
  )

  registerGetTool(
    "get_infrastructure_profile",
    "Get infrastructure profile",
    "Returns the organization's infrastructure profile.",
    () => org.getInfrastructureProfile(),
  )

  registerGetTool(
    "get_security_profile",
    "Get security profile",
    "Returns the organization's security profile.",
    () => org.getSecurityProfile(),
  )

  registerGetTool(
    "get_access_profile",
    "Get access profile",
    "Returns the organization's access profile.",
    () => org.getAccessProfile(),
  )

  registerGetTool(
    "get_activities",
    "Get activities",
    "Returns the organization's business activities.",
    () => org.getActivities(),
  )

  registerGetTool(
    "get_organization_providers",
    "Get organization providers",
    "Returns the organization's provider inventory.",
    () => org.getOrganizationProviders(),
  )

  registerGetTool(
    "get_service_provider_usage",
    "Get service provider usage",
    "Returns the organization's service provider usage.",
    () => org.getServiceProviderUsage(),
  )

  registerGetTool(
    "get_recommendations",
    "Get advisor recommendations",
    "Returns the current advisor recommendations computed from the organization profile.",
    () => org.getRecommendations(),
  )

  registerGetTool(
    "get_vocabulary",
    "Get controlled vocabulary",
    "Returns the organization's controlled vocabulary code sets and codes.",
    () => org.getVocabulary(),
  )

  registerGetTool(
    "list_templates",
    "List document templates",
    "Returns the organization's document templates.",
    () => org.listTemplates(),
  )

  registerGetTool(
    "list_documents",
    "List generated documents",
    "Returns summaries of the organization's generated documents.",
    () => org.listDocuments(),
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
      outputSchema: { data: z.unknown() },
      annotations: readOnlyAnnotations,
    },
    async ({ documentId }) => jsonResult(await org.getDocument(documentId)),
  )

  return server
}
