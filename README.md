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
VITE_MCP_URL=http://localhost:4300
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

Start the hosted MCP server when testing remote AI connections:

```bash
PLYCO_API_URL=http://localhost:4100 pnpm dev:mcp
```

The hosted MCP health check is available at `http://localhost:4300/health`.

Open the client URL printed by Vite, usually:

```text
http://localhost:4200
```

## Admin CLI

The internal operations CLI (`plyco-admin`) reads `PLYCO_API_URL` and
`PLYCO_API_KEY` from the shell or from `.plyco/<profile>.env`. The default
profile is `local`.

```bash
mkdir -p .plyco
cat > .plyco/local.env <<'EOF'
PLYCO_API_URL=http://localhost:4100
PLYCO_API_KEY=replace-with-api-key
EOF
```

Run it from the workspace with pnpm:

```bash
pnpm plyco-admin --help
pnpm plyco-admin codes load
pnpm plyco-admin providers lookup https://example.com
pnpm plyco-admin waitlist add founder@example.com --blocker "SOC 2 timeline"
pnpm plyco-admin waitlist remove founder@example.com
```

For a bare `plyco-admin` command, link the CLI globally:

```bash
pnpm --filter @plyco/admin-cli link --global
```

## Customer CLI

The customer CLI (`plyco`) is a read-only client for organization-scoped data.
It uses the same credentials as `@plyco/mcp`:

```bash
export PLYCO_API_URL=http://localhost:4100
export PLYCO_API_KEY=plyco_org_your_key_here
export PLYCO_ORGANIZATION_ID=your_organization_id

pnpm plyco overview
pnpm plyco documents list
```

Install the bundled agent skill for a coding agent with
`npx -y @plyco/cli skill install`.

See [apps/cli/README.md](apps/cli/README.md) for the full command list.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Publishing npm Packages

Public npm packages:

- `@plyco/contracts`
- `@plyco/api-client`
- `@plyco/cli`
- `@plyco/mcp`

Keep public package versions on the same minor baseline when starting a release.
Because npm versions are immutable, bump versions before publishing if a version
already exists.

Verify the packages before publishing:

```bash
pnpm --filter @plyco/contracts --filter @plyco/api-client --filter @plyco/cli --filter @plyco/mcp build
pnpm --filter @plyco/contracts --filter @plyco/api-client --filter @plyco/cli --filter @plyco/mcp typecheck
pnpm --filter @plyco/contracts --filter @plyco/api-client --filter @plyco/cli --filter @plyco/mcp test
(cd packages/contracts && npm pack --dry-run)
(cd packages/api-client && npm pack --dry-run)
(cd apps/cli && npm pack --dry-run)
(cd apps/mcp && npm pack --dry-run)
```

`@plyco/contracts` and `@plyco/api-client` publish through npm trusted
publishing in `.github/workflows/publish-npm.yml`. The workflow uses GitHub OIDC
and must not receive an npm write token. Trigger it manually and select `all` or
one package after its version has been bumped:

```bash
gh workflow run publish-npm.yml -f package=all
```

Configure each package's npm Trusted Publisher with these exact values:

- provider: GitHub Actions
- organization or user: `khunnils`
- repository: `plyco`
- workflow filename: `publish-npm.yml`
- environment: unset
- allowed action: `npm publish`

Trusted publishing can only be configured after a package exists on npm. For a
brand-new package, use a short-lived granular token with `@plyco` package write
access and bypass 2FA for the first publish only. Token creation does not make
the CLI use that token; pass it through a temporary npm config:

```bash
bootstrap_npmrc=$(mktemp)
chmod 600 "$bootstrap_npmrc"
printf '//registry.npmjs.org/:_authToken=%s\nregistry=https://registry.npmjs.org/\n' "$NPM_BOOTSTRAP_TOKEN" > "$bootstrap_npmrc"
(cd packages/contracts && NPM_CONFIG_USERCONFIG="$bootstrap_npmrc" npm publish --access public)
(cd packages/api-client && NPM_CONFIG_USERCONFIG="$bootstrap_npmrc" npm publish --access public)
rm -f "$bootstrap_npmrc"
unset NPM_BOOTSTRAP_TOKEN
```

After the first release, configure both trusted publishers and revoke the
bootstrap token.

## Workspace Layout

```text
apps/client       React + Vite app
apps/api          Fastify API
apps/web          Astro marketing site
apps/admin-cli    Internal operations CLI
apps/cli          Customer organization data CLI
apps/mcp          Read-only MCP server
packages/contracts    Zod schemas, DTOs, enums
packages/db           Prisma schema and DB mapping
packages/api-client   Organization-scoped API client
docs                  Architecture and product docs
```
