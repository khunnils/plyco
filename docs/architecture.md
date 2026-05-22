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
`apps/client/src/features/vendors`, `apps/client/src/features/security-profile`, and
`apps/client/src/features/shell`. Shared, feature-agnostic UI primitives remain under
`apps/client/src/components`. Client mutations surface success and failure via `sonner` toasts.

## Shared Package

`packages/shared` contains shared elements shared between API and client
`packages/shared/schemas` shared Zod schemas
`packages/shared/data` reference data such as code sets

## Sprint 1 Runtime

The runtime now supports persistent Google-backed user accounts and explicit
organization-scoped workspace routes:

- Google OAuth login is required
- users are persisted and linked to organizations through memberships
- a user can belong to multiple organizations as `owner` or `member`
- the client selects the current organization locally
- workspace API paths include `/organizations/:organizationId`
- vendor inventory is scoped to the route organization, vendors are defined once, and service-specific vendor processing is stored as service-vendor uses
- organization document templates are scoped to the route organization
- generated documents scoped to templates
- controlled vocabulary values are stored as stable code IDs, with labels resolved from organization vocabulary or system code sets
- countries are app-owned ISO alpha-2 reference data, separate from editable vocabulary

The API validates request payloads with `packages/shared` schemas. Google OAuth is handled by Fastify with an encrypted HTTP-only session cookie that stores the persisted account identity. `packages/db` owns Prisma models and database mapping. Company attributes live on the `organizations` table, service profiles are stored as organization-owned rows in `service_profiles`, and organization-level profile sections remain one-to-one relational tables (`privacy_profiles`, `infrastructure_profiles`, `data_handling_profiles`, and `access_profiles`). Service-specific privacy fields such as cookies, analytics/advertising providers, primary hosting region, and data-residency options live on `service_profiles` and service-scoped `organization_providers` rows. Business activities are organization-owned rows in `business_activities` with free-text purpose, vocabulary-backed role, and legal-basis code IDs; services link to performed activities through `service_business_activities`. Organization data types are stored in `organization_data_types`. Vendors are defined once per organization in `vendors`; service-specific processing details live in `service_vendor_uses`, and `vendor_data_types` links service-vendor uses to the data categories they process. Structured vocabulary catalogs are loaded from Airtable `Code Sets` and `Codes` into `system_code_sets` and `system_codes`; non-system sets are cloned per organization into `organization_code_sets` and `organization_codes` so users can edit local vocabulary labels and codes, with missing sets or codes backfilled when vocabulary is next loaded for that organization. Privacy transfer mechanisms remain organization-level privacy code IDs, while hosting/data-residency regions are service-level code IDs. Security control detail is edited inside the existing Access and Infrastructure sections, stored on `access_profiles` and `infrastructure_profiles`, and normalized under `security.*` for document generation. Infrastructure and newsletter provider selections store the catalog `provider_id` and `system_type` on organization-level `organization_providers` rows with no `service_id`; analytics and advertising provider selections are service-scoped rows. System document templates are versioned markdown files in `apps/api/data/templates`, editable organization copies and per-template policy metadata are stored in `templates`, and generated markdown documents are stored in `documents`. Generated document PDFs are uploaded as private objects to the Google Cloud Storage bucket configured by `DOCUMENT_PDF_BUCKET`, which defaults to `plyco-public`, and are downloaded through authenticated API routes.

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
