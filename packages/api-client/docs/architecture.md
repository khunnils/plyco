# @plyco/api-client — Module Architecture

Shared read-only client for organization-scoped Plyco API access. Used by the
customer CLI and MCP server so the org credential config and endpoint map live
in one place.

## Configuration

`readOrgClientConfig` validates:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key (`plyco_org_…`).
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

Callers may pass explicit `apiUrl`, `apiKey`, and `organizationId` values that
override environment variables (for CLI flags).

## Transport

`createFetchJsonClient` sends bearer-authenticated `GET` requests and returns
parsed JSON, throwing `ApiResponseError` on non-2xx responses. `fetch` is
injectable for tests.

## Org read surface

`createOrgClient` exposes methods mapped to organization GET routes:

| Method | Route |
| --- | --- |
| `getOverview` | `GET /organizations/:id` |
| `getProfile` | `GET /organizations/:id/profile` |
| `getServices` | `GET /organizations/:id/services` |
| `getDataTypes` | `GET /organizations/:id/data`, returning `dataTypesStored` |
| `getActivities` | `GET /organizations/:id/business-activities` |
| `getPrivacyProfile` | `GET /organizations/:id/privacy` |
| `getInfrastructureProfile` | `GET /organizations/:id/infrastructure` |
| `getSecurityProfile` | `GET /organizations/:id/security` |
| `getAccessProfile` | `GET /organizations/:id/access` |
| `getOrganizationProviders` | `GET /organizations/:id/organization-providers` |
| `getServiceProviderUsage` | `GET /organizations/:id/service-provider-usage` |
| `getRecommendations` | `GET /organizations/:id/recommendations` |
| `getVocabulary` | `GET /organizations/:id/vocabulary` |
| `listTemplates` | `GET /organizations/:id/templates` |
| `listDocuments` | `GET /organizations/:id/documents` |
| `getDocument(documentId)` | `GET /organizations/:id/documents/:documentId` |

Responses are currently untyped JSON (`unknown`). Adding contract DTO return
types is a follow-up.

## Boundaries

- Read-only. No write, key-management, or admin endpoints.
- Does not depend on applications; applications depend on this package.
- Publish alongside `@plyco/cli` and `@plyco/mcp`, or bundle into their dist.
