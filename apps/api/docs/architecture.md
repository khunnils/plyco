# API Architecture

`apps/api` is a Fastify service that exposes the Sprint 1 security program snapshot.

Auth and multi-tenant membership are intentionally deferred. Routes operate on the single current organization profile. External inputs are validated with `@complyflow/shared` Zod schemas, and route handlers return structured JSON errors.

The templates endpoint combines system templates read from versioned markdown files in `apps/api/data/templates` with organization-owned template copies from the repository. System template files use a simple metadata header followed by markdown content with Jinja-style placeholders. Adding a system template creates an editable organization template; the API does not mutate system template files at runtime.

Document generation builds a normalized context from the current organization profile and vendors, renders template markdown with Nunjucks, stores the generated markdown in `documents`, and computes a source hash from template content plus normalized context so stale documents can be detected.
