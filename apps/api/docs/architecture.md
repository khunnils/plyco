# API Architecture

`apps/api` is a Fastify service that exposes the Sprint 1 security program snapshot.

Auth and multi-tenant membership are intentionally deferred. Routes operate on the single current organization profile. External inputs are validated with `@complyflow/shared` Zod schemas, and route handlers return structured JSON errors.
