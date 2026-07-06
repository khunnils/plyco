# @plyco/mcp — Module Architecture

A stdio [Model Context Protocol](https://modelcontextprotocol.io) server that
gives AI agents read-only access to a single Plyco organization.

## Configuration

`src/config.ts` reads and validates three environment variables with Zod and
fails fast with a clear message when any are missing or invalid:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key created in the client Settings →
  API Keys tab (`plyco_org_…`).
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

## Transport

`src/index.ts` connects an `McpServer` to a `StdioServerTransport`. stdout is
reserved for the MCP protocol; all diagnostics go to stderr.

## API client

`src/api.ts` exposes a small `getJson` helper that sends `GET` requests with the
API key as a bearer token and returns parsed JSON, throwing `ApiResponseError`
on non-2xx responses. The client is injectable (a custom `fetch`) for testing.

## Tools

`src/server.ts` registers read-only tools, all scoped to the configured
organization and mapped to organization GET routes:

| Tool | Route |
| --- | --- |
| `get_organization_overview` | `GET /organizations/:id` |
| `get_profile_section` (`section`) | `GET /organizations/:id/{profile\|services\|data\|privacy\|infrastructure\|security\|access}` |
| `get_recommendations` | `GET /organizations/:id/recommendations` |
| `get_vocabulary` | `GET /organizations/:id/vocabulary` |
| `list_templates` | `GET /organizations/:id/templates` |
| `list_documents` | `GET /organizations/:id/documents` |
| `get_document` (`documentId`) | `GET /organizations/:id/documents/:documentId` |

The server exposes no write tools and no key-management or PDF-download access,
matching the read-only scope of organization API keys.
