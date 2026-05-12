# ComplyFlow — High-Level Architecture

## Purpose

A lightweight security compliance readiness workspace for early-stage startups moving toward serious business customers

## Repository

Single TypeScript monorepo.

```text
complyflow/
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

## Shared Package

`packages/shared` contains shared elements shared between API and client
`packages/shared/schemas` shared Zod schemas
`packages/shared/data` reference data such as code sets

## Sprint 1 Runtime

Sprint 1 implements the Security Program Snapshot with single-organization semantics:

- no auth
- no user or membership model
- one current organization profile
- vendor inventory scoped to that organization

The API validates request payloads with `packages/shared` schemas. `packages/db` owns Prisma models and database mapping. Profile sections are stored as JSON and vendors are stored relationally so inventory entries can be managed independently.

## Local Development

```bash
pnpm install
pnpm db:generate
pnpm dev:api
pnpm dev:client
```

The client reads `VITE_API_URL` and defaults to `http://localhost:4000`. The API expects `DATABASE_URL` for Prisma-backed persistence.

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
