# plyco — High-Level Architecture

## Purpose

A lightweight security compliance readiness workspace for early-stage startups moving toward serious business customers

## Repository

Single TypeScript monorepo.

```text
plyco/
  apps/
    client/              # React + Vite PWA
      docs/
        architecture.md
    api/                 # Node.js + Fastify API
      docs/
        architecture.md
    cli/                 # Commander-based operations CLI
    mcp/                 # Stdio MCP server for AI agents
      docs/
        architecture.md
    web/                 # Astro marketing and waitlist site
  packages/
    shared/              # DTOs, Zod schemas, enums
    db/                  # Prisma schema, migrations, DB client
    config/              # env/config helpers
  docs/
    architecture.md
    spec.md
```

## Stack

### Shared

- TypeScript
- pnpm workspaces
- Zod for validation

### API

- Node.js + Fastify
- PostgreSQL on Neon
- Prisma
- Cloud Run for API
- Google Cloud Storage for assets
- Google Gen AI for content generation
- PostHog capture API for best-effort server-side analytics

### Client

- React + Vite
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zustand for global state
- Firebase Hosting for client

### Marketing Site

- Astro static site with Tailwind CSS
- Firebase Hosting on the separate `web` target
- `PUBLIC_API_URL` points waitlist submissions and sign-in links at the API
- `CLIENT_URL`, `WEB_URL`, and optional comma-separated `CORS_ALLOWED_ORIGINS` define browser origins the API permits

Client source is organized by product feature. Feature-specific screens,
components, TanStack Query hooks (`features/<name>/hooks`), Zustand stores, and
helpers live under folders such as
`apps/client/src/features/documents`, `apps/client/src/features/organizations`,
`apps/client/src/features/vendors`, `apps/client/src/features/company`, and
`apps/client/src/features/shell`. Shared, feature-agnostic UI primitives remain under
`apps/client/src/components`. Client mutations surface success and failure via `sonner` toasts.

## Shared Package

`packages/shared` contains shared elements shared between API and client
`packages/shared/schemas` shared Zod schemas, including document template, template preview, and template variable catalog contracts
`packages/shared/data` reference data such as code sets

## Sprint 1 Runtime

The runtime now supports persistent Google-backed user accounts and explicit
organization-scoped workspace routes:

- Google OAuth or email magic-link login is required
- users are persisted and linked to organizations through memberships
- a user can belong to multiple organizations as `owner` or `member`
- owners can manage team members, send and cancel invitations, and delete the organization
- the client selects the current organization locally
- workspace API paths include `/organizations/:organizationId`
- provider inventory is scoped to the route organization, providers are defined once, and service-specific provider processing is stored as service provider usage managed from each service view
- organization document templates are scoped to the route organization and can be copied from system templates or created from scratch
- generated documents scoped to templates
- advisor recommendations are computed from static YAML rules against answered saved-profile values and returned from an organization-scoped endpoint
- controlled vocabulary values are stored as stable code IDs, with labels and optional descriptions resolved from organization vocabulary or system code sets
- document context derives `service.privacy.allSubprocessorsDataRegion` when every recorded subprocessor for a service has exactly one matching data region
- Airtable vocabulary imports persist `Uses Hints`; organization code descriptions are copied on clone/backfill and remain locally editable
- countries are app-owned ISO alpha-2 reference data, separate from editable vocabulary
- services, business activities, and organization data types have organization-scoped, zero-based sort positions; reorder requests must contain the complete current ID set and update all positions atomically

Advisor evaluation treats `null`, `undefined`, and empty strings as unset, while
booleans, zero, explicit codes, and arrays including `[]` are defined. Every
scalar predicate in a boolean condition must be defined before the condition is
evaluated. Collection predicates skip incomplete items and continue evaluating
complete items. YAML comparison values cannot include `null`, and
framework-specific rules use explicit compliance-goal gates.

The recommendations response also computes transient readiness scores for five
dashboard areas. Security, Privacy, Access, and Infrastructure retain direct
scores; Activities, Data, Services, and Vendors rules roll up into Product &
Data. Applicable rules with complete condition inputs are
weighted by severity (`critical=8`, `high=4`, `medium=2`, `low=1`); passing
weight divided by assessed weight produces the score. Unanswered applicable
rules affect coverage counts but not the score, and rules whose applicability
gate is false or unanswered are excluded. The overall score pools rule weights
across areas rather than averaging area percentages.

The API validates request payloads with `packages/shared` schemas. Google OAuth and email magic links are handled by Fastify with an encrypted HTTP-only session cookie that stores the persisted account identity. User email is the canonical unique identity; Google subjects are optional provider identities and are attached to an existing user when the verified Google email matches. Magic-link tokens are 15-minute, single-use SHA-256 hashes stored in `magic_link_tokens`. `packages/db` owns Prisma models and database mapping. Team invitations are stored in `organization_invitations` with SHA-256 token hashes, pending/accepted/canceled timestamps, inviter metadata, and a 30-day expiry; raw invitation tokens only appear in emailed join links. Resend sends invitation and magic-link email when `RESEND_API_KEY` and `INVITATION_EMAIL_FROM` are configured, and invite acceptance requires the signed-in email to match the invited email. Company attributes live on the `organizations` table, service profiles are stored as organization-owned rows in `service_profiles`, and organization-level profile sections remain one-to-one relational tables (`privacy_profiles`, `infrastructure_profiles`, `security_profiles`, `data_handling_profiles`, and `access_profiles`). Editable onboarding/profile values are nullable: `null` means unanswered, while empty arrays, empty strings, zero, `false`, and explicit code values are intentional answers. Profile-owned code lists are stored as nullable JSON so `null` and `[]` round-trip distinctly. Service-specific privacy fields such as cookie/tracking use, structured fixed cookie categories, the four conditional consent controls, and primary hosting region live on `service_profiles`. Business activities are organization-owned rows in `business_activities` with free-text purpose, vocabulary-backed role, and legal-basis code IDs; services link to performed activities through `service_business_activities`, and activities link to processed organization data types through `business_activity_data_types`. Repository reads return services, activities, and data types by persisted sort position, then creation time and ID for deterministic fallback. Compliance-targeted field visibility is defined in shared metadata keyed by stable field IDs and compliance goal code IDs; hidden values remain stored and are only hidden from relevant UI/progress surfaces. Organization data types are stored in `organization_data_types` and exposed with stable IDs after persistence. Providers are defined once per organization in `organization_providers`; service-specific processing details and analytics/advertising roles live in `service_provider_usage`, are edited from the selected service view in the client, and `provider_usage_data_types` links service usage rows to the data categories they process. Structured vocabulary catalogs are loaded from Airtable `Code Sets` and `Codes` into `system_code_sets` and `system_codes`; non-system sets are cloned per organization into `organization_code_sets` and `organization_codes` so users can edit local vocabulary labels and codes, with missing sets or codes backfilled when vocabulary is next loaded for that organization unless an organization code row already exists, including soft-deleted removed codes. Privacy transfer mechanisms remain organization-level privacy code IDs. Cookie categories are fixed embedded service records, while hosting regions remain service-level code IDs. Security control detail is edited across Access, Infrastructure, and Security. Development security, vulnerability management, and incident response are stored on `security_profiles`; monitoring, encryption, backups, and vendor risk remain on `infrastructure_profiles`; all controls are normalized under `security.*` for document generation and advisor rule evaluation. Advisor rules are static category YAML files in `apps/api/data/rules`; the recommendations endpoint validates and evaluates field predicates, boolean groups, compliance-goal gates, and collection predicates at request time without persisting findings. Infrastructure and newsletter provider selections are tracked in `organization_providers.system_types`; analytics and advertising selections are service usage rows with `system_type`. System document templates are versioned markdown files in `apps/api/data/templates`, editable organization templates and per-template policy metadata are stored in `templates`, and scratch templates have no source system template slug. The API exposes read-only template helper routes for the canonical variable schema and server-rendered draft previews; previews reuse the document generation context and renderer but do not create documents or PDFs. Generated markdown documents are stored in `documents` with a source hash and required JSON source fingerprint built from template content and the context paths referenced by that template; summaries compare current fingerprints to report stale status and reasons. The report context builder adds `Answered` and `HasValue` helper flags beside profile fields so templates do not inspect raw null or empty values directly, exposes activity-level data type mappings and AI governance fields (`usesAi`, `aiUseCases`, `aiCustomerDataUsedForTraining`, `aiCustomerDataSentToProviders`, `aiHumanReviewOfOutputs`, `aiUsersInformedWhenUsed`) under each service activity, plus aggregate `services.*` flags (`hasActivities`, `usesAi`, `cookiesAnswered`, `hasHostingRegion`) so multi-service sections can be guarded without inspecting each row. Policy dates are exposed as `policy.effectiveDate` from the editable `organizations.policy_effective_date` and `policy.lastUpdatedDate` derived deterministically from `organization.updatedAt` (date-only). Personnel-security attestations (`access_profiles.security_training_required`, `confidentiality_agreements_required`), penetration-testing cadence/last-date and the responsible-disclosure program flag/URL (`security_profiles.penetration_testing_cadence`, `penetration_test_last_date`, `vulnerability_disclosure_program_exists`, `vulnerability_disclosure_url`) feed the data security policy. Both system policies guard every data-driven section so unanswered controls are omitted entirely rather than implying a deficiency. Generated document PDFs are uploaded as private objects to the Google Cloud Storage bucket configured by `DOCUMENT_PDF_BUCKET`, which defaults to `plyco-public`, and are downloaded through authenticated API routes.

The API also exposes machine-facing global routes for the Plyco tool. `POST /codes/load`, `POST /providers/lookup`, `POST /providers/import`, and `DELETE /waitlist` are protected with bearer `PLYCO_API_KEY`. Code loading runs server-side from Airtable `Code Sets` and `Codes` into the system vocabulary tables so CLI profiles only need an API URL and key. Provider catalog reads load the Airtable `Providers` table, including the `System Types` multi-value field and optional `Logo` attachment URL; the client falls back to provider-domain favicons when Airtable has no logo. Provider lookup accepts a provider URL, loads category code IDs from Airtable `Provider Categories.Code` and system type code IDs from the `provider_system_types` code set, compiles the Langfuse `resolve_provider` prompt with code IDs only, and executes Gemini Flash through the Google Gen AI SDK with a structured JSON response schema constrained to those Airtable code IDs. Langfuse tracing is initialized through OpenTelemetry when Langfuse credentials are configured so the Google generation observation is exported. Provider import reuses lookup and upserts the resolved provider organization and provider into Airtable, failing if the resolved provider category does not already exist in the linked provider category table; it does not write to application persistence. Waitlist removal deletes the local waitlist entry by normalized email and best-effort removes the Resend contact from the configured waitlist segment.

`apps/cli` is a Commander-based operations tool run with `pnpm plyco`. It targets environments through local `.plyco/<profile>.env` files containing only `PLYCO_API_URL` and `PLYCO_API_KEY`; it does not load API server `.env` files or hold Airtable, Gemini, Langfuse, database, OAuth, or session config. It exposes operations commands for code loading, provider lookup/import, and waitlist add/remove.

Organizations can issue per-organization API keys that grant read-only access to that organization's data. Keys are stored as SHA-256 hashes in `organization_api_keys` (with a short display prefix and creator metadata) and cascade-delete with the organization; the raw key (`plyco_org_<random>`) is returned only once at creation and never persisted in plaintext. Owners create, list, and revoke keys through session-authenticated, owner-only routes under `/organizations/:organizationId/api-keys`. When a request carries a bearer token that hashes to a stored key, the global auth pre-handler authorizes GET requests whose URL organization matches the key's organization; writes, the key-management routes, the binary PDF download, and cross-organization access remain session-only or rejected. The global `PLYCO_API_KEY` stays limited to the operations routes and is not used for workspace reads.

`apps/mcp` is a stdio Model Context Protocol server (`@plyco/mcp`) that lets AI agents read a single organization's workspace over the official `@modelcontextprotocol/sdk`. It is configured entirely through environment variables (`PLYCO_API_URL`, `PLYCO_API_KEY`, `PLYCO_ORGANIZATION_ID`), fails fast on invalid config, and exposes read-only tools (organization overview, explicit profile and workspace data readers, recommendations, vocabulary, templates, documents) that map to the organization-scoped GET routes using the per-organization API key as a bearer token. It writes diagnostics only to stderr because stdout is the protocol channel.

The create organization flow also has authenticated pre-organization lookup helpers. `POST /organization-lookup/website` accepts a website URL, loads lookup code IDs from Airtable master data, compiles the Langfuse `website_parser` prompt with `websiteUrl` and plain-text code-set IDs, and executes Gemini through the Google Gen AI SDK with structured JSON output plus Google Search and URL Context tools enabled. It returns editable defaults for the shared onboarding profile, one primary service, multiple starting data types, multiple starting activities, and a privacy policy URL when one is found. The client can then call `POST /organization-lookup/privacy-policy` with that privacy policy URL; the API loads privacy code IDs from Airtable, compiles `privacy_policy_parser` with `privacyPolicyUrl` and those code sets, uses the same Gemini tools, and returns organization-level privacy profile defaults. Lookup output is validated with shared Zod schemas and is only used as editable defaults; persistence still happens through organization creation, business activity creation for each onboarding activity, the existing security profile save route for service and data-type drafts, and provider inventory routes. If Airtable, `GEMINI_API_KEY`, or Langfuse credentials are not configured, local website lookup returns a manual fallback draft with a warning and privacy policy lookup returns an empty privacy profile.

Explicit infrastructure and AI answers that no provider is used are stored on `infrastructure_profiles.explicit_no_provider_system_types`. They round-trip as `providerId: "none"` profile selections but never create `organization_providers` inventory rows.

Activity-level AI governance answers live on `business_activities`: whether the activity uses AI, free-text AI use cases, whether customer data is used for training or sent to AI providers, whether outputs get human review, and whether users are informed when AI is used. These fields flow through the document-generation context onto each service activity and drive the privacy policy's "Use of artificial intelligence" section, guarded by the `services.usesAi` aggregate flag.

Service cookie configuration uses a fixed shared enum rather than organization
vocabulary. Each service stores at most one embedded JSON record for each of
Necessary, Preferences, Analytics, and Marketing, including an editable consent
requirement. Consent mechanism, prior blocking,
withdrawal method, and Global Privacy Control support remain service columns;
Do Not Track, equal-rejection, and pre-ticked-box fields are not stored.

## Public Waitlist

The marketing site submits to public `POST /waitlist`. The API validates and normalizes the shared payload, applies a per-instance fixed-window IP limit, silently accepts honeypot submissions without persistence, upserts legitimate entries by normalized email in `waitlist_entries`, and syncs legitimate submissions to Resend contacts using `RESEND_API_KEY` and `WAITLIST_RESEND_SEGMENT_ID`. Resend contacts are tagged with `source=waitlist`, store the optional blocker in `notes`, and are added to the configured `Plyco - Waitlist` segment. After persistence and Resend sync succeed, the API best-effort captures `waitlist_signup_completed` through the server-side PostHog client when `POSTHOG_PROJECT_TOKEN` is configured. Accepted requests return the opaque `202 { accepted: true }` response and no confirmation email is sent. Production CORS permits the authenticated `CLIENT_URL`, public `WEB_URL`, and any extra normalized origins in `CORS_ALLOWED_ORIGINS`.

## Local Development

```bash
pnpm install
pnpm db:generate
pnpm dev:api
pnpm dev:client
```

The client reads `VITE_API_URL` and defaults to `http://localhost:4100`. The API expects `DATABASE_URL` for Prisma-backed persistence and requires OAuth, session, and email settings when auth is enabled.

## Deployment

```text
Client build -> Firebase Hosting
API GitHub Actions workflow -> Docker image -> Artifact Registry -> Cloud Run
Postgres -> Neon
Assets -> Google Cloud Storage
```

## Environments

- local
- dev
- prod
