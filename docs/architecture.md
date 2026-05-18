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
- vendor inventory is scoped to the route organization
- organization document templates are scoped to the route organization
- generated documents scoped to templates
- controlled vocabulary values are stored as stable code IDs, with labels resolved from organization vocabulary or system code sets
- countries are app-owned ISO alpha-2 reference data, separate from editable vocabulary

The API validates request payloads with `packages/shared` schemas. Google OAuth is handled by Fastify with an encrypted HTTP-only session cookie that stores the persisted account identity. `packages/db` owns Prisma models and database mapping. Company attributes live on the `organizations` table, profile sections are stored in one-to-one relational tables (`service_profiles` holds the organization's primary product/service context, `privacy_profiles` holds privacy rights, request handling, cookies, tracking, analytics, and marketing communications context, alongside `infrastructure_profiles`, `data_handling_profiles`, and `access_profiles`), organization data types are stored in `organization_data_types`, and provider inventory is stored relationally in `organization_providers` with `vendor_data_types` linking providers to the data categories they process. Structured vocabulary catalogs are loaded from Airtable `Code Sets` and `Codes` into `system_code_sets` and `system_codes`; non-system sets are cloned per organization into `organization_code_sets` and `organization_codes` so users can edit local vocabulary labels and codes, with missing sets or codes backfilled when vocabulary is next loaded for that organization. Infrastructure and privacy analytics/advertising/newsletter provider selections store the catalog `provider_id` and `system_type` on `organization_providers`. System document templates are versioned markdown files in `apps/api/data/templates`, editable organization copies and per-template policy metadata are stored in `templates`, and generated markdown documents are stored in `documents`. Generated document PDFs are uploaded as private objects to the Google Cloud Storage bucket configured by `DOCUMENT_PDF_BUCKET`, which defaults to `plyco-public`, and are downloaded through authenticated API routes.

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
