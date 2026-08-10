# @plyco/mcp — Module Architecture

A stdio [Model Context Protocol](https://modelcontextprotocol.io) server that
gives AI agents read-only access to a single Plyco organization.

## Configuration and API access

Organization credential config and org-scoped reads are owned by
`@plyco/api-client`. The MCP server reads config with `readOrgClientConfig` and
invokes `createOrgClient` methods from tool handlers.

Required environment variables:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key created in the client Settings →
  API Keys tab (`plyco_org_…`).
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

## Transport

`src/index.ts` connects an `McpServer` to a `StdioServerTransport`. stdout is
reserved for the MCP protocol; all diagnostics go to stderr.

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
