# @plyco/mcp — Module Architecture

A [Model Context Protocol](https://modelcontextprotocol.io) adapter that gives
AI agents access to a single Plyco organization. It supports hosted Streamable
HTTP and local stdio transports. Write tools require an organization API key
with scope `read_write`.

## Configuration and API access

Organization credential config and org-scoped API calls are owned by
`@plyco/api-client`. Tool handlers invoke `createOrgClient` methods rather than
duplicating API behavior.

The local stdio entrypoint reads these environment variables:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key created in the client Settings →
  API Keys tab (`plyco_org_…`). Use a `read_write` key for write tools.
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

## Transport

`src/index.ts` connects an `McpServer` to a `StdioServerTransport`. stdout is
reserved for the MCP protocol; all diagnostics go to stderr.

`src/hosted.ts` starts the public HTTP process. Each
`/organizations/:organizationId/mcp` request creates a stateless Streamable
HTTP transport and an organization client from the request's bearer API key.
The API verifies that the key grants access to the organization according to
its scope; the MCP service does not access persistence or infer authorization
itself.

The hosted process requires `PLYCO_API_URL` and accepts optional `MCP_HOST`,
`MCP_PORT`, and `MCP_ALLOWED_HOSTS` configuration. `GET /health` is the only
unauthenticated route.

## Tools

`src/server.ts` registers tools that map onto `@plyco/api-client` methods.

### Read tools

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

### Write tools

| Tool | Org client method |
| --- | --- |
| `update_company_profile` | `updateProfile` |
| `update_services` | `updateServices` |
| `update_data_handling` | `updateDataHandling` |
| `update_privacy_profile` | `updatePrivacyProfile` |
| `update_infrastructure_profile` | `updateInfrastructureProfile` |
| `update_security_profile` | `updateSecurityProfile` |
| `update_access_profile` | `updateAccessProfile` |
| `add_organization_provider` | `addOrganizationProvider` |
| `update_organization_provider` | `updateOrganizationProvider` |
| `remove_organization_provider` | `removeOrganizationProvider` |
| `resolve_provider` | `resolveProvider` |
| `add_service_provider_usage` | `addServiceProviderUsage` |
| `update_service_provider_usage` | `updateServiceProviderUsage` |
| `remove_service_provider_usage` | `removeServiceProviderUsage` |
| `add_activity` | `addActivity` |
| `update_activity` | `updateActivity` |
| `remove_activity` | `removeActivity` |
| `add_vocabulary_code` | `addVocabularyCode` |
| `update_vocabulary_code` | `updateVocabularyCode` |
| `remove_vocabulary_code` | `removeVocabularyCode` |

The server exposes no key-management or PDF-download access. Document and
template editing are not exposed as MCP tools.
