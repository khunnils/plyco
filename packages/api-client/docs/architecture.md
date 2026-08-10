# @plyco/api-client — Module Architecture

Shared client for organization-scoped Plyco API access. Used by the customer
CLI and MCP server so the org credential config and endpoint map live in one
place. Write methods require an organization API key with scope `read_write`.

## Configuration

`readOrgClientConfig` validates:

- `PLYCO_API_URL` — base URL of the Plyco API.
- `PLYCO_API_KEY` — a per-organization API key (`plyco_org_…`).
- `PLYCO_ORGANIZATION_ID` — the organization the key belongs to.

Callers may pass explicit `apiUrl`, `apiKey`, and `organizationId` values that
override environment variables (for CLI flags).

## Transport

`createFetchJsonClient` sends bearer-authenticated JSON requests (`GET` via
`getJson`, and `POST`/`PUT`/`DELETE` via `sendJson`) and returns parsed JSON,
throwing `ApiResponseError` on non-2xx responses. Empty 204 bodies become
`null`. `fetch` is injectable for tests.

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

## Org write surface

| Method | Route |
| --- | --- |
| `updateProfile` | `PUT /organizations/:id/profile` |
| `updateServices` | `PUT /organizations/:id/services` |
| `updateDataHandling` | `PUT /organizations/:id/data` |
| `updatePrivacyProfile` | `PUT /organizations/:id/privacy` |
| `updateInfrastructureProfile` | `PUT /organizations/:id/infrastructure` |
| `updateSecurityProfile` | `PUT /organizations/:id/security` |
| `updateAccessProfile` | `PUT /organizations/:id/access` |
| `addOrganizationProvider` | `POST /organizations/:id/organization-providers` |
| `updateOrganizationProvider` | `PUT /organizations/:id/organization-providers/:providerId` |
| `removeOrganizationProvider` | `DELETE /organizations/:id/organization-providers/:providerId` |
| `resolveProvider` | `POST /organizations/:id/organization-providers/resolve` |
| `addServiceProviderUsage` | `POST /organizations/:id/service-provider-usage` |
| `updateServiceProviderUsage` | `PUT /organizations/:id/service-provider-usage/:usageId` |
| `removeServiceProviderUsage` | `DELETE /organizations/:id/service-provider-usage/:usageId` |
| `addActivity` | `POST /organizations/:id/business-activities` |
| `updateActivity` | `PUT /organizations/:id/business-activities/:activityId` |
| `removeActivity` | `DELETE /organizations/:id/business-activities/:activityId` |
| `addVocabularyCode` | `POST /organizations/:id/vocabulary/:codeSetId/codes` |
| `updateVocabularyCode` | `PUT /organizations/:id/vocabulary/:codeSetId/codes/:codeId` |
| `removeVocabularyCode` | `DELETE /organizations/:id/vocabulary/:codeSetId/codes/:codeId` |

Responses are currently untyped JSON (`unknown`). Adding contract DTO return
types is a follow-up.

## Boundaries

- No key-management, admin, or PDF-download endpoints.
- Does not depend on applications; applications depend on this package.
- Publish alongside `@plyco/cli` and `@plyco/mcp`, or bundle into their dist.
