import swagger from "@fastify/swagger"
import scalarApiReference from "@scalar/fastify-api-reference"
import {
  acceptOrganizationInvitationSchema,
  authStateSchema,
  businessActivityInputSchema,
  businessActivitySchema,
  countrySchema,
  createDocumentSchema,
  createOrganizationSchema,
  createTemplateFromSystemSchema,
  deleteOrganizationResponseSchema,
  documentSchema,
  documentSummarySchema,
  magicLinkRequestSchema,
  magicLinkResponseSchema,
  organizationInvitationInputSchema,
  organizationInvitationSchema,
  organizationLookupResultSchema,
  organizationMemberRoleUpdateSchema,
  organizationMemberSchema,
  organizationPrivacyPolicyLookupInputSchema,
  organizationProviderInputSchema,
  organizationProviderInventorySchema,
  organizationSummarySchema,
  organizationWebsiteLookupInputSchema,
  privacyProfileSchema,
  providerImportResultSchema,
  providerLookupInputSchema,
  providerLookupResultSchema,
  providerSchema,
  recommendationsResponseSchema,
  reorderEntitiesSchema,
  securityProfileSchema,
  serviceProviderUsageInputSchema,
  serviceProviderUsageSchema,
  structuredErrorSchema,
  templateCatalogSchema,
  templateInputSchema,
  templatePreviewInputSchema,
  templatePreviewSchema,
  templateSchema,
  templateVariableCatalogSchema,
  vocabularyCodeInputSchema,
  vocabularyCodeSchema,
  vocabularySchema,
  waitlistInputSchema,
  waitlistResponseSchema,
} from "@plyco/shared"
import { type FastifyInstance } from "fastify"
import { type OpenAPIV3 } from "openapi-types"
import { z } from "zod"

type HttpMethod = "get" | "post" | "put" | "patch" | "delete"
type JsonObject = Record<string, unknown>
type PathItem = Partial<Record<HttpMethod, OpenAPIV3.OperationObject>>

const organizationIdParamsSchema = z.object({
  organizationId: z.string().min(1),
})
const idParamsSchema = organizationIdParamsSchema.extend({
  id: z.string().min(1),
})
const userIdParamsSchema = organizationIdParamsSchema.extend({
  userId: z.string().min(1),
})
const invitationIdParamsSchema = organizationIdParamsSchema.extend({
  invitationId: z.string().min(1),
})
const tokenParamsSchema = z.object({ token: z.string().min(20) })
const magicLinkCallbackQuerySchema = z.object({
  token: z.string().min(20),
  returnTo: z.string().optional(),
})
const vocabularyCodeSetParamsSchema = organizationIdParamsSchema.extend({
  codeSetId: z.string().min(1),
})
const vocabularyCodeParamsSchema = vocabularyCodeSetParamsSchema.extend({
  codeId: z.string().min(1),
})

const codeLoadResultSchema = z.object({
  codeSetCount: z.number().int().nonnegative(),
  codeCount: z.number().int().nonnegative(),
  countryCount: z.number().int().nonnegative(),
})
const securityProfileSnapshotSchema = z.object({
  organization: z.unknown(),
  businessActivities: z.array(businessActivitySchema),
  organizationProviders: z.array(organizationProviderInventorySchema),
  serviceProviderUsage: z.array(serviceProviderUsageSchema),
})
const securityProfileBodySchema = z.object({
  company: z.unknown(),
  services: z.array(z.unknown()).min(1),
  privacy: z.unknown(),
  infrastructure: z.unknown(),
  security: securityProfileSchema,
  dataHandling: z.unknown(),
  access: z.unknown(),
})
const templatePreviewResponseSchema = z.object({
  renderedContent: z.string(),
})
const templateCreateBodySchema = z.union([
  templateInputSchema,
  createTemplateFromSystemSchema,
])

const jsonSchema = (schema: z.ZodType): JsonObject =>
  z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonObject

const content = (schema: z.ZodType) => ({
  "application/json": {
    schema: jsonSchema(schema),
  },
})

const requestBody = (schema: z.ZodType) => ({
  required: true,
  content: content(schema),
})

const response = (
  description: string,
  schema?: z.ZodType,
  contentType = "application/json",
) => {
  if (!schema) {
    return { description }
  }

  return {
    description,
    content: {
      [contentType]: {
        schema: jsonSchema(schema),
      },
    },
  }
}

const binaryResponse = (description: string): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/pdf": {
      schema: {
        type: "string",
        format: "binary",
      },
    },
  },
})

const route = ({
  summary,
  tag,
  params,
  query,
  body,
  success,
  successSchema,
  successContentType,
  security = [{ cookieAuth: [] }],
}: {
  summary: string
  tag: string
  params?: z.ZodType
  query?: z.ZodType
  body?: z.ZodType
  success: number
  successSchema?: z.ZodType
  successContentType?: string
  security?: Array<Record<string, string[]>>
}) => ({
  summary,
  tags: [tag],
  ...(security.length > 0 ? { security } : {}),
  ...(params ? { parameters: pathParameters(params) } : {}),
  ...(query ? { parameters: queryParameters(query) } : {}),
  ...(params && query
    ? { parameters: [...pathParameters(params), ...queryParameters(query)] }
    : {}),
  ...(body ? { requestBody: requestBody(body) } : {}),
  responses: {
    [success]: response("Successful response.", successSchema, successContentType),
    "4XX": response("Client error.", structuredErrorSchema),
    "5XX": response("Server error.", structuredErrorSchema),
  },
})

const pathParameters = (schema: z.ZodType) =>
  parameters(schema, "path", true)

const queryParameters = (schema: z.ZodType) =>
  parameters(schema, "query", false)

function parameters(schema: z.ZodType, location: "path" | "query", required: boolean) {
  const converted = jsonSchema(schema)
  const properties =
    typeof converted.properties === "object" && converted.properties
      ? (converted.properties as Record<string, JsonObject>)
      : {}

  return Object.entries(properties).map(([name, parameterSchema]) => ({
    name,
    in: location,
    required,
    schema: parameterSchema,
  }))
}

const publicRoute = (input: Omit<Parameters<typeof route>[0], "security">) =>
  route({ ...input, security: [] })

const apiKeyRoute = (input: Omit<Parameters<typeof route>[0], "security">) =>
  route({ ...input, security: [{ bearerAuth: [] }] })

const paths: Record<string, PathItem> = {
  "/health": {
    get: publicRoute({
      summary: "Check API health.",
      tag: "System",
      success: 200,
      successSchema: z.object({ status: z.literal("ok") }),
    }),
  },
  "/waitlist": {
    post: publicRoute({
      summary: "Join the public waitlist.",
      tag: "Waitlist",
      body: waitlistInputSchema,
      success: 202,
      successSchema: waitlistResponseSchema,
    }),
  },
  "/auth/google": {
    get: publicRoute({
      summary: "Start Google OAuth sign-in.",
      tag: "Auth",
      success: 302,
    }),
  },
  "/auth/google/callback": {
    get: publicRoute({
      summary: "Complete Google OAuth sign-in.",
      tag: "Auth",
      success: 302,
    }),
  },
  "/auth/magic-link": {
    post: publicRoute({
      summary: "Request an email magic link.",
      tag: "Auth",
      body: magicLinkRequestSchema,
      success: 202,
      successSchema: magicLinkResponseSchema,
    }),
  },
  "/auth/magic-link/callback": {
    get: publicRoute({
      summary: "Consume a magic-link token and create a session.",
      tag: "Auth",
      query: magicLinkCallbackQuerySchema,
      success: 302,
    }),
  },
  "/auth/me": {
    get: publicRoute({
      summary: "Return the current auth state.",
      tag: "Auth",
      success: 200,
      successSchema: authStateSchema,
    }),
  },
  "/auth/logout": {
    post: publicRoute({
      summary: "Clear the current session.",
      tag: "Auth",
      success: 204,
    }),
  },
  "/organizations": {
    post: route({
      summary: "Create an organization for the current user.",
      tag: "Organizations",
      body: createOrganizationSchema,
      success: 201,
      successSchema: organizationSummarySchema,
    }),
  },
  "/organizations/{organizationId}": {
    delete: route({
      summary: "Delete an organization.",
      tag: "Organizations",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: deleteOrganizationResponseSchema,
    }),
  },
  "/organizations/{organizationId}/members": {
    get: route({
      summary: "List organization members.",
      tag: "Team",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(organizationMemberSchema),
    }),
  },
  "/organizations/{organizationId}/members/{userId}": {
    patch: route({
      summary: "Update a member role.",
      tag: "Team",
      params: userIdParamsSchema,
      body: organizationMemberRoleUpdateSchema,
      success: 200,
      successSchema: organizationMemberSchema,
    }),
    delete: route({
      summary: "Remove a member.",
      tag: "Team",
      params: userIdParamsSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/invitations": {
    get: route({
      summary: "List organization invitations.",
      tag: "Team",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(organizationInvitationSchema),
    }),
    post: route({
      summary: "Invite an organization member.",
      tag: "Team",
      params: organizationIdParamsSchema,
      body: organizationInvitationInputSchema,
      success: 201,
      successSchema: organizationInvitationSchema,
    }),
  },
  "/organizations/{organizationId}/invitations/{invitationId}": {
    delete: route({
      summary: "Cancel an organization invitation.",
      tag: "Team",
      params: invitationIdParamsSchema,
      success: 204,
    }),
  },
  "/invitations/{token}/accept": {
    post: route({
      summary: "Accept an organization invitation.",
      tag: "Team",
      params: tokenParamsSchema,
      success: 200,
      successSchema: acceptOrganizationInvitationSchema,
    }),
  },
  "/organization-lookup/website": {
    post: route({
      summary: "Generate editable organization defaults from a website.",
      tag: "Organization Lookup",
      body: organizationWebsiteLookupInputSchema,
      success: 200,
      successSchema: organizationLookupResultSchema,
    }),
  },
  "/organization-lookup/privacy-policy": {
    post: route({
      summary: "Generate editable privacy defaults from a privacy policy.",
      tag: "Organization Lookup",
      body: organizationPrivacyPolicyLookupInputSchema,
      success: 200,
      successSchema: privacyProfileSchema,
    }),
  },
  "/organizations/{organizationId}/security-profile": {
    get: route({
      summary: "Load the organization security profile snapshot.",
      tag: "Security Profile",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: securityProfileSnapshotSchema,
    }),
    put: route({
      summary: "Save the organization security profile snapshot.",
      tag: "Security Profile",
      params: organizationIdParamsSchema,
      body: securityProfileBodySchema,
      success: 200,
      successSchema: securityProfileSnapshotSchema,
    }),
  },
  "/organizations/{organizationId}/services/order": {
    put: route({
      summary: "Reorder organization services.",
      tag: "Security Profile",
      params: organizationIdParamsSchema,
      body: reorderEntitiesSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/data-types/order": {
    put: route({
      summary: "Reorder organization data types.",
      tag: "Security Profile",
      params: organizationIdParamsSchema,
      body: reorderEntitiesSchema,
      success: 204,
    }),
  },
  "/providers": {
    get: publicRoute({
      summary: "List the provider catalog.",
      tag: "Providers",
      success: 200,
      successSchema: z.array(providerSchema),
    }),
  },
  "/providers/lookup": {
    post: apiKeyRoute({
      summary: "Resolve provider details from a URL.",
      tag: "Providers",
      body: providerLookupInputSchema,
      success: 200,
      successSchema: providerLookupResultSchema,
    }),
  },
  "/providers/import": {
    post: apiKeyRoute({
      summary: "Import a resolved provider into Airtable.",
      tag: "Providers",
      body: providerLookupInputSchema,
      success: 200,
      successSchema: providerImportResultSchema,
    }),
  },
  "/organizations/{organizationId}/business-activities": {
    get: route({
      summary: "List business activities.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(businessActivitySchema),
    }),
    post: route({
      summary: "Create a business activity.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      body: businessActivityInputSchema,
      success: 201,
      successSchema: businessActivitySchema,
    }),
  },
  "/organizations/{organizationId}/business-activities/{id}": {
    put: route({
      summary: "Update a business activity.",
      tag: "Vendors",
      params: idParamsSchema,
      body: businessActivityInputSchema,
      success: 200,
      successSchema: businessActivitySchema,
    }),
    delete: route({
      summary: "Delete a business activity.",
      tag: "Vendors",
      params: idParamsSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/business-activities/order": {
    put: route({
      summary: "Reorder business activities.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      body: reorderEntitiesSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/organization-providers": {
    get: route({
      summary: "List organization providers.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(organizationProviderInventorySchema),
    }),
    post: route({
      summary: "Create an organization provider.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      body: organizationProviderInputSchema,
      success: 201,
      successSchema: organizationProviderInventorySchema,
    }),
  },
  "/organizations/{organizationId}/organization-providers/resolve": {
    post: route({
      summary: "Resolve provider details for organization provider creation.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      body: providerLookupInputSchema,
      success: 200,
      successSchema: providerLookupResultSchema,
    }),
  },
  "/organizations/{organizationId}/organization-providers/{id}": {
    put: route({
      summary: "Update an organization provider.",
      tag: "Vendors",
      params: idParamsSchema,
      body: organizationProviderInputSchema,
      success: 200,
      successSchema: organizationProviderInventorySchema,
    }),
    delete: route({
      summary: "Delete an organization provider.",
      tag: "Vendors",
      params: idParamsSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/service-provider-usage": {
    get: route({
      summary: "List service provider usage records.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(serviceProviderUsageSchema),
    }),
    post: route({
      summary: "Create a service provider usage record.",
      tag: "Vendors",
      params: organizationIdParamsSchema,
      body: serviceProviderUsageInputSchema,
      success: 201,
      successSchema: serviceProviderUsageSchema,
    }),
  },
  "/organizations/{organizationId}/service-provider-usage/{id}": {
    put: route({
      summary: "Update a service provider usage record.",
      tag: "Vendors",
      params: idParamsSchema,
      body: serviceProviderUsageInputSchema,
      success: 200,
      successSchema: serviceProviderUsageSchema,
    }),
    delete: route({
      summary: "Delete a service provider usage record.",
      tag: "Vendors",
      params: idParamsSchema,
      success: 204,
    }),
  },
  "/countries": {
    get: publicRoute({
      summary: "List supported countries.",
      tag: "Vocabulary",
      success: 200,
      successSchema: z.array(countrySchema),
    }),
  },
  "/organizations/{organizationId}/vocabulary": {
    get: route({
      summary: "List organization vocabulary.",
      tag: "Vocabulary",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: vocabularySchema,
    }),
  },
  "/organizations/{organizationId}/vocabulary/{codeSetId}/codes": {
    post: route({
      summary: "Create an organization vocabulary code.",
      tag: "Vocabulary",
      params: vocabularyCodeSetParamsSchema,
      body: vocabularyCodeInputSchema,
      success: 201,
      successSchema: vocabularyCodeSchema,
    }),
  },
  "/organizations/{organizationId}/vocabulary/{codeSetId}/codes/{codeId}": {
    put: route({
      summary: "Update an organization vocabulary code.",
      tag: "Vocabulary",
      params: vocabularyCodeParamsSchema,
      body: vocabularyCodeInputSchema,
      success: 200,
      successSchema: vocabularyCodeSchema,
    }),
    delete: route({
      summary: "Delete an organization vocabulary code.",
      tag: "Vocabulary",
      params: vocabularyCodeParamsSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/recommendations": {
    get: route({
      summary: "Evaluate advisor recommendations.",
      tag: "Recommendations",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: recommendationsResponseSchema,
    }),
  },
  "/organizations/{organizationId}/templates": {
    get: route({
      summary: "List system and organization document templates.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: templateCatalogSchema,
    }),
    post: route({
      summary: "Create a custom template or copy a system template.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      body: templateCreateBodySchema,
      success: 201,
      successSchema: templateSchema,
    }),
  },
  "/organizations/{organizationId}/templates/schema": {
    get: route({
      summary: "Return the template variable catalog.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: templateVariableCatalogSchema,
    }),
  },
  "/organizations/{organizationId}/templates/preview": {
    post: route({
      summary: "Render an unsaved template preview.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      body: templatePreviewInputSchema,
      success: 200,
      successSchema: templatePreviewResponseSchema,
    }),
  },
  "/organizations/{organizationId}/templates/{id}": {
    put: route({
      summary: "Update an organization template.",
      tag: "Documents",
      params: idParamsSchema,
      body: templateInputSchema,
      success: 200,
      successSchema: templateSchema,
    }),
    delete: route({
      summary: "Delete an organization template.",
      tag: "Documents",
      params: idParamsSchema,
      success: 204,
    }),
  },
  "/organizations/{organizationId}/documents": {
    get: route({
      summary: "List generated document summaries.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      success: 200,
      successSchema: z.array(documentSummarySchema),
    }),
    post: route({
      summary: "Generate or refresh a document from a template.",
      tag: "Documents",
      params: organizationIdParamsSchema,
      body: createDocumentSchema,
      success: 201,
      successSchema: documentSchema,
    }),
  },
  "/organizations/{organizationId}/documents/{id}": {
    get: route({
      summary: "Get a generated document.",
      tag: "Documents",
      params: idParamsSchema,
      success: 200,
      successSchema: documentSchema,
    }),
  },
  "/organizations/{organizationId}/documents/{id}/pdf": {
    get: {
      ...route({
        summary: "Download a generated document PDF.",
        tag: "Documents",
        params: idParamsSchema,
        success: 200,
      }),
      responses: {
        200: binaryResponse("Successful response."),
        "4XX": response("Client error.", structuredErrorSchema),
        "5XX": response("Server error.", structuredErrorSchema),
      },
    },
  },
  "/codes/load": {
    post: apiKeyRoute({
      summary: "Load Airtable code sets and countries into system vocabulary.",
      tag: "Operations",
      success: 200,
      successSchema: codeLoadResultSchema,
    }),
  },
}

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Plyco API",
    version: "0.0.1",
    description:
      "OpenAPI documentation for Plyco's Fastify API. Runtime validation remains in route handlers with shared Zod schemas.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local API" }],
  tags: [
    { name: "System" },
    { name: "Waitlist" },
    { name: "Auth" },
    { name: "Organizations" },
    { name: "Team" },
    { name: "Organization Lookup" },
    { name: "Security Profile" },
    { name: "Providers" },
    { name: "Vendors" },
    { name: "Vocabulary" },
    { name: "Recommendations" },
    { name: "Documents" },
    { name: "Operations" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "cf_session",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  paths,
} satisfies JsonObject

export async function registerOpenApi(app: FastifyInstance) {
  await app.register(swagger, {
    mode: "static",
    specification: {
      document: openApiDocument as unknown as OpenAPIV3.Document,
    },
  })

  await app.register(scalarApiReference, {
    routePrefix: "/docs",
    openApiDocumentEndpoints: {
      json: "/json",
      yaml: "/yaml",
    },
    configuration: {
      title: "Plyco API Reference",
    },
  })
}
