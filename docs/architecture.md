# Plyco System Architecture

## Purpose

Plyco is a multi-tenant security and compliance readiness platform. This
document describes the stable system boundaries and dependency rules. Product
behavior belongs in `docs/spec.md`; visual and interaction rules belong in
`docs/design.md` and `docs/ux-guidelines.md`.

## System Context

```text
Browser users ──> Client application ──> API ──> PostgreSQL
                        │                 │
Public visitors ──> Marketing site       ├──> Object storage
                                          ├──> AI and prompt services
Operators ───────> Admin CLI ────────────┤
Customers/agents ─> Customer CLI ────────┤
AI agents ───────> MCP server ───────────┴──> External data, email,
                                              and observability services
```

The API is the authoritative boundary for application data and business rules.
Browser applications, both CLIs, and the MCP server do not access the database
or third-party services on its behalf directly.

## Repository Structure

Plyco is a TypeScript pnpm workspace monorepo.

```text
apps/
  api/        Fastify HTTP API and application services
  client/     React and Vite authenticated application
  web/        Astro public website
  admin-cli/  Internal operations command-line client
  cli/        Customer read-only organization data CLI
  mcp/        Read-only Model Context Protocol adapter
packages/
  contracts/  Cross-boundary DTOs, Zod schemas, enums, and reference data
  db/         Prisma schema, migrations, generated client, and DB mapping
  api-client/ Organization-scoped API client shared by the CLI and MCP server
docs/         Repository-wide product, design, and architecture documents
```

Module-specific architecture documents live beside their modules. The root
document records only relationships that affect the system as a whole.

## Component Responsibilities

### Client application

The client is the authenticated browser interface. It is organized by product
area, uses the API as its backend, and consumes shared contracts. Server state
is handled separately from local UI state; authorization and business
invariants remain server responsibilities.

### Marketing site

The web application is a separately deployed public site. It renders static
marketing content and calls explicitly public API endpoints where required. It
does not share the authenticated client runtime.

### API

The API is the system's composition and trust boundary. It authenticates
callers, authorizes organization access, validates inputs, coordinates domain
services, persists state, and isolates external integrations. Its internal
architecture is documented in `apps/api/docs/architecture.md`.

### Admin CLI

The admin CLI (`plyco-admin`) is a thin operational client for
machine-authorized internal API operations such as loading system code sets. It
is configured with an API URL and credential and must not depend on server-only
configuration or connect directly to persistence and integration providers.

### Customer CLI

The customer CLI (`plyco`) is a read-only, organization-scoped client for
scripts and AI agents. It uses a per-organization API credential and shares its
API surface with the MCP server through `@plyco/api-client`.

### MCP server

The MCP server adapts organization-scoped API reads into tools for AI agents.
It supports a hosted Streamable HTTP endpoint and a local stdio package. Both
are intentionally read-only and use an organization API credential via
`@plyco/api-client`; neither duplicates API business logic. Hosted connections
are stateless and bind the request credential to the organization in the MCP
endpoint URL, with final tenant authorization enforced by the API.

### Shared packages

`@plyco/contracts` owns transport-facing contracts shared across applications.
`@plyco/db` owns the relational schema and Prisma implementation. Database-only
types must not leak into public contracts. `@plyco/api-client` owns the shared
customer-credential read path used by the customer CLI and MCP server.

## Dependency Rules

```text
client ─────┐
api ────────┼──> contracts
api ────────┴──> db ──> contracts

cli ──┐
mcp ──┴──> api-client ──> API over HTTP

web and admin-cli communicate with the API over HTTP.
```

- Applications may depend on shared packages, but shared packages do not
  depend on applications.
- The API translates between public DTOs and persistence models.
- Cross-boundary inputs are validated with shared Zod schemas.
- Domain behavior belongs in the owning application or package, not in clients
  that happen to consume it.
- External providers are accessed behind API-owned adapters so provider details
  do not become domain contracts.

## Data and Tenancy

PostgreSQL is the source of truth for application state. Prisma schema and
migrations are owned by `@plyco/db`. Workspace data is organization-scoped, and
the API enforces tenant boundaries before data access. Shared catalog data and
organization-owned data are distinct so local customization does not mutate
system defaults.

Binary artifacts are stored in private object storage and referenced from the
database. Version-controlled definitions that are part of application behavior
may be loaded from the repository at runtime; generated or user-owned state is
persisted outside the source tree.

## Security Boundaries

- Browser access uses server-managed sessions.
- Organization membership and roles govern workspace access.
- Machine access uses purpose-specific bearer credentials with narrower scopes.
- Secrets and provider credentials remain in the API deployment environment.
- Private artifacts are delivered through authenticated API paths rather than
  public storage URLs.
- Public endpoints are explicit and apply their own validation and abuse
  controls.

## Runtime and Deployment

The client and marketing site are independent static deployments. The API runs
as a containerized Node.js service on Cloud Run, uses PostgreSQL on Neon, and
stores private artifacts in Google Cloud Storage. External services provide
email delivery, master data, AI capabilities, analytics, and observability.

Deployments are stateless apart from PostgreSQL and object storage. Environment
configuration selects provider credentials, allowed origins, and optional
integrations; it must not change domain contracts.

## Architectural Change Rules

- Keep product-specific behavior out of architecture documents.
- Update this document when system boundaries, ownership, dependency direction,
  trust boundaries, or deployment topology change.
- Update the relevant module architecture when responsibilities move between
  modules.
- Update shared contracts and their consumers together when an API boundary
  changes.
