# Plyco

Lightweight security compliance readiness workspace for early-stage startups.

## Prerequisites

- Node.js `>=22.12.0`
- pnpm
- PostgreSQL-compatible database for persistent API data

## Install

```bash
pnpm install
pnpm db:generate
```

## Environment

Copy the example files before running locally:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
```

The API loads `.env` from the repo root first, then `apps/api/.env` as an override. The client uses Vite’s standard `apps/client/.env` loading.

For persistent local data, set `DATABASE_URL` in `apps/api/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/plyco
```

If `DATABASE_URL` is blank or removed, the API starts with in-memory storage for local development only.

Set the client API URL in `apps/client/.env`:

```dotenv
VITE_API_URL=http://localhost:4100
```

## Run Locally

Start the API:

```bash
pnpm dev:api
```

Start the client in another terminal:

```bash
pnpm dev:client
```

Open the client URL printed by Vite, usually:

```text
http://localhost:4200
```

## CLI

The operations CLI reads `PLYCO_API_URL` and `PLYCO_API_KEY` from the shell or from `.plyco/<profile>.env`. The default profile is `local`.

```bash
mkdir -p .plyco
cat > .plyco/local.env <<'EOF'
PLYCO_API_URL=http://localhost:4100
PLYCO_API_KEY=replace-with-api-key
EOF
```

Run it from the workspace with pnpm:

```bash
pnpm plyco --help
pnpm plyco codes load
pnpm plyco providers lookup https://example.com
pnpm plyco waitlist add founder@example.com --blocker "SOC 2 timeline"
pnpm plyco waitlist remove founder@example.com
```

For a bare `plyco` command, link the CLI globally:

```bash
pnpm --filter @plyco/cli link --global
```

If your shell reports `permission denied: plyco`, it is resolving the `/Users/nils/src/plyco` repository directory instead of a CLI executable. Put the pnpm global bin directory earlier in `PATH` than `/Users/nils/src`, then restart the shell or run `hash -r` so zsh forgets any stale command lookup.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Workspace Layout

```text
apps/client       React + Vite app
apps/api          Fastify API
apps/web          Astro marketing site
packages/shared   Zod schemas, DTOs, enums
packages/db       Prisma schema and DB mapping
docs              Architecture and product docs
```
