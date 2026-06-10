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
    web/                 # Astro marketing site
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

### Client

- React + Vite
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zustand for global state
- Firebase Hosting for client

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

- Google OAuth login is required
- users are persisted and linked to organizations through memberships
- a user can belong to multiple organizations as `owner` or `member`
- the client selects the current organization locally
- workspace API paths include `/organizations/:organizationId`
- provider inventory is scoped to the route organization, providers are defined once, and service-specific provider processing is stored as service provider usage managed from each service view
- organization document templates are scoped to the route organization and can be copied from system templates or created from scratch
- generated documents scoped to templates
- advisor recommendations are computed from static YAML rules against the saved organization profile and returned from an organization-scoped endpoint
- controlled vocabulary values are stored as stable code IDs, with labels and optional descriptions resolved from organization vocabulary or system code sets
- Airtable vocabulary imports persist `Uses Hints`; organization code descriptions are copied on clone/backfill and remain locally editable
- countries are app-owned ISO alpha-2 reference data, separate from editable vocabulary
- services, business activities, and organization data types have organization-scoped, zero-based sort positions; reorder requests must contain the complete current ID set and update all positions atomically

The API validates request payloads with `packages/shared` schemas. Google OAuth is handled by Fastify with an encrypted HTTP-only session cookie that stores the persisted account identity. `packages/db` owns Prisma models and database mapping. Company attributes live on the `organizations` table, service profiles are stored as organization-owned rows in `service_profiles`, and organization-level profile sections remain one-to-one relational tables (`privacy_profiles`, `infrastructure_profiles`, `data_handling_profiles`, and `access_profiles`). Editable onboarding/profile values are nullable: `null` means unanswered, while empty arrays, empty strings, zero, `false`, and explicit code values are intentional answers. Profile-owned code lists are stored as nullable JSON so `null` and `[]` round-trip distinctly. Service-specific privacy fields such as cookie/tracking use, consent mechanism, Do Not Track response, Global Privacy Control support, and primary hosting region live on `service_profiles`. Business activities are organization-owned rows in `business_activities` with free-text purpose, vocabulary-backed role, and legal-basis code IDs; services link to performed activities through `service_business_activities`, and activities link to processed organization data types through `business_activity_data_types`. Repository reads return services, activities, and data types by persisted sort position, then creation time and ID for deterministic fallback. Compliance-targeted field visibility is defined in shared metadata keyed by stable field IDs and compliance goal code IDs; hidden values remain stored and are only hidden from relevant UI/progress surfaces. Organization data types are stored in `organization_data_types` and exposed with stable IDs after persistence. Providers are defined once per organization in `organization_providers`; service-specific processing details and analytics/advertising roles live in `service_provider_usage`, are edited from the selected service view in the client, and `provider_usage_data_types` links service usage rows to the data categories they process. Structured vocabulary catalogs are loaded from Airtable `Code Sets` and `Codes` into `system_code_sets` and `system_codes`; non-system sets are cloned per organization into `organization_code_sets` and `organization_codes` so users can edit local vocabulary labels and codes, with missing sets or codes backfilled when vocabulary is next loaded for that organization unless an organization code row already exists, including soft-deleted removed codes. Privacy transfer mechanisms remain organization-level privacy code IDs, while cookie/tracking categories and hosting regions are service-level code IDs. Security control detail is edited inside the existing Access and Infrastructure sections, stored on `access_profiles` and `infrastructure_profiles`, and normalized under `security.*` for document generation and advisor rule evaluation. Advisor rules are static category YAML files in `apps/api/data/rules`; the recommendations endpoint validates and evaluates field predicates, boolean groups, compliance-goal gates, and collection predicates at request time without persisting findings. Infrastructure and newsletter provider selections are tracked in `organization_providers.system_types`; analytics and advertising selections are service usage rows with `system_type`. System document templates are versioned markdown files in `apps/api/data/templates`, editable organization templates and per-template policy metadata are stored in `templates`, and scratch templates have no source system template slug. The API exposes read-only template helper routes for the canonical variable schema and server-rendered draft previews; previews reuse the document generation context and renderer but do not create documents or PDFs. Generated markdown documents are stored in `documents`. The report context builder adds `Answered` and `HasValue` helper flags beside profile fields so templates do not inspect raw null or empty values directly, exposes activity-level data type mappings under each service activity, plus aggregate `services.*` flags (`hasActivities`, `cookiesAnswered`, `hasHostingRegion`) so multi-service sections can be guarded without inspecting each row. Policy dates are exposed as `policy.effectiveDate` from the editable `organizations.policy_effective_date` and `policy.lastUpdatedDate` derived deterministically from `organization.updatedAt` (date-only). Personnel-security attestations (`access_profiles.security_training_required`, `confidentiality_agreements_required`), penetration-testing cadence/last-date and the responsible-disclosure program flag/URL (`infrastructure_profiles.penetration_testing_cadence`, `penetration_test_last_date`, `vulnerability_disclosure_program_exists`, `vulnerability_disclosure_url`) feed the data security policy. Both system policies guard every data-driven section so unanswered controls are omitted entirely rather than implying a deficiency. Generated document PDFs are uploaded as private objects to the Google Cloud Storage bucket configured by `DOCUMENT_PDF_BUCKET`, which defaults to `plyco-public`, and are downloaded through authenticated API routes.

The API also exposes machine-facing global routes for the Plyco tool. `POST /codes/load`, `POST /providers/lookup`, and `POST /providers/import` are protected with bearer `PLYCO_API_KEY`. Code loading runs server-side from Airtable `Code Sets` and `Codes` into the system vocabulary tables so CLI profiles only need an API URL and key. Provider catalog reads load the Airtable `Providers` table, including the `System Types` multi-value field and optional `Logo` attachment URL; the client falls back to provider-domain favicons when Airtable has no logo. Provider lookup accepts a provider URL, loads category code IDs from Airtable `Provider Categories.Code` and system type code IDs from the `provider_system_types` code set, compiles the Langfuse `resolve_provider` prompt with code IDs only, and executes Gemini Flash through the Google Gen AI SDK with a structured JSON response schema constrained to those Airtable code IDs. Langfuse tracing is initialized through OpenTelemetry when Langfuse credentials are configured so the Google generation observation is exported. Provider import reuses lookup and upserts the resolved provider organization and provider into Airtable, failing if the resolved provider category does not already exist in the linked provider category table; it does not write to application persistence.

`apps/cli` is a Commander-based operations tool run with `pnpm plyco`. It targets environments through local `.plyco/<profile>.env` files containing only `PLYCO_API_URL` and `PLYCO_API_KEY`; it does not load API server `.env` files or hold Airtable, Gemini, Langfuse, database, OAuth, or session config.

The create organization flow also has authenticated pre-organization lookup helpers. `POST /organization-lookup/website` accepts a website URL, loads lookup code IDs from Airtable master data, compiles the Langfuse `website_parser` prompt with `websiteUrl` and plain-text code-set IDs, and executes Gemini through the Google Gen AI SDK with structured JSON output plus Google Search and URL Context tools enabled. It returns editable defaults for the shared onboarding profile, one primary service, multiple starting data types, multiple starting activities, and a privacy policy URL when one is found. The client can then call `POST /organization-lookup/privacy-policy` with that privacy policy URL; the API loads privacy code IDs from Airtable, compiles `privacy_policy_parser` with `privacyPolicyUrl` and those code sets, uses the same Gemini tools, and returns organization-level privacy profile defaults. Lookup output is validated with shared Zod schemas and is only used as editable defaults; persistence still happens through organization creation, business activity creation for each onboarding activity, the existing security profile save route for service and data-type drafts, and provider inventory routes. If Airtable, `GEMINI_API_KEY`, or Langfuse credentials are not configured, local website lookup returns a manual fallback draft with a warning and privacy policy lookup returns an empty privacy profile.

## Local Development

```bash
pnpm install
pnpm db:generate
pnpm dev:api
pnpm dev:client
```

The client reads `VITE_API_URL` and defaults to `http://localhost:4000`. The API expects `DATABASE_URL` for Prisma-backed persistence and requires Google OAuth/session settings when auth is enabled.

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
