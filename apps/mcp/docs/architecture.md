# @plyco/mcp — Module Architecture

A [Model Context Protocol](https://modelcontextprotocol.io) adapter that gives
AI agents read-only access to a single Plyco organization. It supports hosted
Streamable HTTP and local stdio transports.

## Configuration and API access

Organization credential config and org-scoped reads are owned by
`@plyco/api-client`. Tool handlers invoke `createOrgClient` methods rather than
duplicating API behavior.

The local stdio entrypoint reads these environment variables:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key created in the client Settings →
  API Keys tab (`plyco_org_…`).
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

## Transport

`src/index.ts` connects an `McpServer` to a `StdioServerTransport`. stdout is
reserved for the MCP protocol; all diagnostics go to stderr.

`src/hosted.ts` starts the public HTTP process. Each
`/organizations/:organizationId/mcp` request creates a stateless Streamable
HTTP transport and an organization client from the request's bearer API key.
The API verifies that the key grants read-only access to the organization; the
MCP service does not access persistence or infer authorization itself.

The hosted process requires `PLYCO_API_URL` and accepts optional `MCP_HOST`,
`MCP_PORT`, and `MCP_ALLOWED_HOSTS` configuration. `GET /health` is the only
unauthenticated route.

## Tools

`src/server.ts` registers read-only tools that map one-to-one onto
`@plyco/api-client` methods:

| Tool | Org client method |
| --- | --- |
| `get_organization_overview` | `getOverview` |
| `get_company_profile` | `getProfile` |
| `get_services` | `getServices` |
| `get_data_types` | `getDataTypes` |
| `get_activities` | `getActivities` |
| `get_privacy_profile` | `getPrivacyProfile` |
| `get_infrastructure_profile` | `getInfrastructureProfile` |
| `get_security_profile` | `getSecurityProfile` |
| `get_access_profile` | `getAccessProfile` |
| `get_organization_providers` | `getOrganizationProviders` |
| `get_service_provider_usage` | `getServiceProviderUsage` |
| `get_recommendations` | `getRecommendations` |
| `get_vocabulary` | `getVocabulary` |
| `list_templates` | `listTemplates` |
| `list_documents` | `listDocuments` |
| `get_document` (`documentId`) | `getDocument` |

The server exposes no write tools and no key-management or PDF-download access,
matching the read-only scope of organization API keys.
