import { type OrgClient } from "@plyco/api-client"
import {
  accessProfileSchema,
  businessActivityInputSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  organizationProviderInputSchema,
  privacyProfileSchema,
  providerLookupInputSchema,
  securityProfileSchema,
  serviceProfileInputSchema,
  serviceProviderUsageFieldsSchema,
  vocabularyCodeInputSchema,
} from "@plyco/contracts"
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

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const

const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: false,
} as const

const destructiveAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
  idempotentHint: true,
} as const

export function createMcpServer(org: OrgClient): McpServer {
  const server = new McpServer(
    {
      name: "plyco-mcp",
      version: "0.1.0",
    },
    {
      instructions:
        "Use Plyco as the authoritative record of how the connected organization currently operates. Read tools work with any organization API key. Write tools require a key with scope read_write and fail with an authentication error otherwise. Plyco data supports compliance readiness work but is not certification or legal advice.",
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

  server.registerTool(
    "update_company_profile",
    {
      title: "Update company profile",
      description:
        "Replaces the organization's company profile. Requires a read_write API key.",
      inputSchema: companyProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updateProfile(input)),
  )

  server.registerTool(
    "update_services",
    {
      title: "Update services",
      description:
        "Replaces the organization's services list. Requires a read_write API key.",
      inputSchema: {
        services: z
          .array(serviceProfileInputSchema)
          .min(1)
          .describe("Full replacement list of services."),
      },
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async ({ services }) => jsonResult(await org.updateServices(services)),
  )

  server.registerTool(
    "update_data_handling",
    {
      title: "Update data handling",
      description:
        "Replaces the organization's data handling profile. Requires a read_write API key.",
      inputSchema: dataHandlingProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updateDataHandling(input)),
  )

  server.registerTool(
    "update_privacy_profile",
    {
      title: "Update privacy profile",
      description:
        "Replaces the organization's privacy profile. Requires a read_write API key.",
      inputSchema: privacyProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updatePrivacyProfile(input)),
  )

  server.registerTool(
    "update_infrastructure_profile",
    {
      title: "Update infrastructure profile",
      description:
        "Replaces the organization's infrastructure profile. Requires a read_write API key.",
      inputSchema: infrastructureProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updateInfrastructureProfile(input)),
  )

  server.registerTool(
    "update_security_profile",
    {
      title: "Update security profile",
      description:
        "Replaces the organization's security profile. Requires a read_write API key.",
      inputSchema: securityProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updateSecurityProfile(input)),
  )

  server.registerTool(
    "update_access_profile",
    {
      title: "Update access profile",
      description:
        "Replaces the organization's access profile. Requires a read_write API key.",
      inputSchema: accessProfileSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async (input) => jsonResult(await org.updateAccessProfile(input)),
  )

  server.registerTool(
    "add_organization_provider",
    {
      title: "Add organization provider",
      description:
        "Adds a provider to the organization inventory. Requires a read_write API key.",
      inputSchema: organizationProviderInputSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: createAnnotations,
    },
    async (input) => jsonResult(await org.addOrganizationProvider(input)),
  )

  server.registerTool(
    "update_organization_provider",
    {
      title: "Update organization provider",
      description:
        "Updates a provider in the organization inventory. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Organization provider inventory ID."),
        ...organizationProviderInputSchema.shape,
      },
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async ({ id, ...input }) =>
      jsonResult(await org.updateOrganizationProvider(id, input)),
  )

  server.registerTool(
    "remove_organization_provider",
    {
      title: "Remove organization provider",
      description:
        "Removes a provider from the organization inventory. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Organization provider inventory ID."),
      },
      outputSchema: { data: z.unknown() },
      annotations: destructiveAnnotations,
    },
    async ({ id }) => jsonResult(await org.removeOrganizationProvider(id)),
  )

  server.registerTool(
    "resolve_provider",
    {
      title: "Resolve provider",
      description:
        "Resolves provider details from a URL for inventory creation. Requires a read_write API key.",
      inputSchema: providerLookupInputSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: createAnnotations,
    },
    async (input) => jsonResult(await org.resolveProvider(input)),
  )

  server.registerTool(
    "add_service_provider_usage",
    {
      title: "Add service provider usage",
      description:
        "Creates a service-provider usage record. Requires a read_write API key.",
      inputSchema: serviceProviderUsageFieldsSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: createAnnotations,
    },
    async (input) => jsonResult(await org.addServiceProviderUsage(input)),
  )

  server.registerTool(
    "update_service_provider_usage",
    {
      title: "Update service provider usage",
      description:
        "Updates a service-provider usage record. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Service provider usage ID."),
        ...serviceProviderUsageFieldsSchema.shape,
      },
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async ({ id, ...input }) =>
      jsonResult(await org.updateServiceProviderUsage(id, input)),
  )

  server.registerTool(
    "remove_service_provider_usage",
    {
      title: "Remove service provider usage",
      description:
        "Deletes a service-provider usage record. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Service provider usage ID."),
      },
      outputSchema: { data: z.unknown() },
      annotations: destructiveAnnotations,
    },
    async ({ id }) => jsonResult(await org.removeServiceProviderUsage(id)),
  )

  server.registerTool(
    "add_activity",
    {
      title: "Add business activity",
      description:
        "Creates a business activity. Requires a read_write API key.",
      inputSchema: businessActivityInputSchema.shape,
      outputSchema: { data: z.unknown() },
      annotations: createAnnotations,
    },
    async (input) => jsonResult(await org.addActivity(input)),
  )

  server.registerTool(
    "update_activity",
    {
      title: "Update business activity",
      description:
        "Updates a business activity. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Business activity ID."),
        ...businessActivityInputSchema.shape,
      },
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async ({ id, ...input }) => jsonResult(await org.updateActivity(id, input)),
  )

  server.registerTool(
    "remove_activity",
    {
      title: "Remove business activity",
      description:
        "Deletes a business activity. Requires a read_write API key.",
      inputSchema: {
        id: z.string().min(1).describe("Business activity ID."),
      },
      outputSchema: { data: z.unknown() },
      annotations: destructiveAnnotations,
    },
    async ({ id }) => jsonResult(await org.removeActivity(id)),
  )

  server.registerTool(
    "add_vocabulary_code",
    {
      title: "Add vocabulary code",
      description:
        "Creates a vocabulary code in a code set. Requires a read_write API key.",
      inputSchema: {
        codeSetId: z.string().min(1).describe("Vocabulary code set ID."),
        ...vocabularyCodeInputSchema.shape,
      },
      outputSchema: { data: z.unknown() },
      annotations: createAnnotations,
    },
    async ({ codeSetId, ...input }) =>
      jsonResult(await org.addVocabularyCode(codeSetId, input)),
  )

  server.registerTool(
    "update_vocabulary_code",
    {
      title: "Update vocabulary code",
      description:
        "Updates a vocabulary code. Requires a read_write API key.",
      inputSchema: {
        codeSetId: z.string().min(1).describe("Vocabulary code set ID."),
        currentCodeId: z
          .string()
          .min(1)
          .describe("Current vocabulary code ID to update."),
        ...vocabularyCodeInputSchema.shape,
      },
      outputSchema: { data: z.unknown() },
      annotations: writeAnnotations,
    },
    async ({ codeSetId, currentCodeId, ...input }) =>
      jsonResult(
        await org.updateVocabularyCode(codeSetId, currentCodeId, input),
      ),
  )

  server.registerTool(
    "remove_vocabulary_code",
    {
      title: "Remove vocabulary code",
      description:
        "Deletes a vocabulary code. Requires a read_write API key.",
      inputSchema: {
        codeSetId: z.string().min(1).describe("Vocabulary code set ID."),
        codeId: z.string().min(1).describe("Vocabulary code ID."),
      },
      outputSchema: { data: z.unknown() },
      annotations: destructiveAnnotations,
    },
    async ({ codeSetId, codeId }) =>
      jsonResult(await org.removeVocabularyCode(codeSetId, codeId)),
  )

  return server
}
