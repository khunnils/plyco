# API Architecture

## Purpose

`@plyco/api` is the authoritative HTTP and application-service boundary for
Plyco. It exposes public, session-authenticated, and machine-authenticated
interfaces while keeping persistence and third-party provider details behind
internal abstractions.

This document describes API structure and design constraints. Endpoint behavior
belongs in the OpenAPI document and product behavior belongs in
`docs/spec.md`.

## Runtime Shape

The API is a Node.js application built on Fastify.

```text
HTTP request
    │
    ▼
Fastify plugins and cross-cutting middleware
    │  CORS, authentication, logging, error handling, documentation
    ▼
Feature route
    │  input validation, authorization, response mapping
    ▼
Application/domain service
    │  orchestration and business rules
    ├──────────────> Repository interface ──> Prisma ──> PostgreSQL
    └──────────────> Integration interface ──> External provider
```

`src/app.ts` is the composition root. It creates the Fastify application,
selects production adapters, installs cross-cutting concerns, and registers
feature routes. `src/server.ts` owns process startup and graceful shutdown.

## Code Organization

```text
src/
  app.ts              dependency composition and route registration
  server.ts           process lifecycle
  config.ts           environment-backed runtime configuration
  features/           vertically owned HTTP and application modules
  infrastructure/     framework, persistence-adjacent, and provider adapters
data/                  version-controlled runtime definitions
tests/                 API-level integration tests
```

Feature modules are vertical slices. A feature owns its routes, application
logic, repository contract, and persistence implementation when applicable.
Code shared by several features belongs in infrastructure only when it is truly
cross-cutting; domain ownership should otherwise remain explicit.

## Layer Responsibilities

### HTTP layer

Routes translate HTTP requests into typed application calls. They validate
external input with `@plyco/contracts` Zod schemas, apply the appropriate access
policy, and return DTOs or structured errors. Route handlers should not expose
Prisma records or provider response shapes.

### Application and domain layer

Services coordinate business rules and workflows. They depend on interfaces
for persistence and external capabilities, which keeps domain behavior
testable and independent of Fastify, Prisma, and vendor SDKs.

### Persistence layer

Repository interfaces are owned by the feature that consumes them. Prisma
implementations map between the relational model in `@plyco/db` and API-facing
domain values. In-memory implementations support focused tests and local
composition without creating a second production architecture.

### Infrastructure layer

Infrastructure adapters encapsulate authentication, object storage, external
data sources, AI and prompt providers, email, analytics, observability, and API
documentation. Adapters translate provider failures and payloads before they
reach feature logic.

## API Boundaries

Published policy documents may be served as sanitized HTML from
`GET /public/:orgSlug/:templateSlug`. That route is unauthenticated, looks up
the organization by `publicSlug` and the template by slug, and returns 404 unless
the template is marked public and has a generated document. Markdown is converted
with `marked` and sanitized before it is placed in a standalone HTML page; the
PDF renderer remains a separate private export path.

The API has three deliberate access classes:

- Public routes are individually declared and protected with endpoint-specific
  validation and abuse controls. Hosted policy pages are public reads of
  opt-in published documents only.
- Browser workspace routes use encrypted HTTP-only sessions and authorize
  access through organization membership and role.
- Machine routes use purpose-specific bearer keys. Organization keys are
  tenant-scoped with an explicit scope (`read` for GET-only access, or
  `read_write` for member-equivalent writes on the key's organization).
  Operational keys are limited to administrative operations. Owner-only routes
  (API keys, invitations, members, org delete) remain session-only.

Organization identity in a path or payload is never sufficient authorization.
Every organization-scoped operation resolves the caller and verifies access
before reading or writing organization data.

## Contracts and Errors

`@plyco/contracts` is the source of truth for cross-boundary request and response
schemas. The API may use richer internal types, but it maps them to shared DTOs
at the HTTP boundary. Database-only fields stay in `@plyco/db` and API internals.

All expected failures use the central structured error format. Unexpected
errors are logged and reported through observability hooks without leaking
secrets or internal provider details to callers.

The OpenAPI description is served by the API when enabled. It is maintained
alongside route changes and describes the externally supported HTTP contract;
it is not a substitute for runtime validation.

## Data and Consistency

PostgreSQL is the source of truth for persistent application state. Mutations
that maintain ordering, membership, or relationship invariants must be atomic.
Tenant identifiers are carried through repository operations so isolation is
enforced below the route layer as well as at authorization time.

Static, version-controlled definitions may be loaded from `data/`. They remain
separate from organization-owned state and are validated before use. Private
binary artifacts live in object storage, with database records retaining their
metadata and object references.

## External Integrations

External systems are optional capabilities selected in the composition root.
Feature code consumes narrow interfaces rather than SDK clients. Configuration,
credentials, retries, telemetry, and provider-specific mapping stay inside the
adapter boundary.

Operations that are explicitly best-effort, such as analytics or telemetry,
must not determine the success of the primary transaction. Integrations that
are required for an operation return structured failures when unavailable.

### Organization lookup

`ORGANIZATION_LOOKUP_STRATEGY` selects `firecrawl` (default) or `agent` in the
organization lookup service factory. Both implement the same website and
privacy-policy lookup contract. The agent strategy retains Gemini search and
URL-context tools. Firecrawl uses an API-owned scraper adapter with
`FIRECRAWL_API_KEY`; the Cloud Run deployment maps that environment variable to
the `firecrawl-api-key` Secret Manager secret.

The Firecrawl strategy scrapes the landing page as markdown and links, preserving
headers and footers. Regex-extracted markdown links and returned links are
normalized and deduplicated before the `link_extractor` prompt selects up to ten
privacy/security pages. Only discovered HTTP(S) links may be followed. The prompt receives
`primaryDomain` and `links` and is loaded from Langfuse without a local prompt
fallback. Each selected page is then scraped as markdown. The landing page and successful related pages each run
through `website_parser` with `text`, `websiteUrl`, and `codeSets`, without URL
or search tools. Scraped text is appended if the production prompt does not yet
reference `text`.

Raw page extractions are merged before profile defaults are applied. Later
nonempty legal/contact details refine earlier values, the landing page's service
identity is retained, code lists and named activities/data categories are combined
and deduplicated, and positive data-handling evidence survives later false or
unknown values. Missing values do not overwrite populated fields. Secondary
scrape/parse failures become bounded warnings; landing-page failures remain
structured upstream errors. Privacy-policy lookup also scrapes its page before
running `privacy_policy_parser` with the supplied text.

## Operability

The service provides a health endpoint, structured logging, centralized error
handling, graceful shutdown, and optional tracing and error reporting. CORS is
configured from trusted browser origins. API documentation is normally enabled
outside production and opt-in in production.

The runtime is stateless. Durable state belongs in PostgreSQL or object storage,
which allows multiple API instances without process-local coordination.

## Testing and Evolution

- Test domain behavior through injected repositories and provider interfaces.
- Use API-level tests for routing, validation, authentication, authorization,
  error mapping, and adapter composition.
- Keep feature boundaries intact when adding routes; do not put business logic
  in `app.ts` or generic infrastructure helpers.
- Update shared schemas, OpenAPI metadata, and consumers together when the HTTP
  contract changes.
- Update this document only when API layering, trust boundaries, composition,
  persistence strategy, or integration architecture changes.
