# API Agent Instructions

## Architecture Fit

- `apps/api` is a Fastify service. Keep route behavior simple and aligned with the single-organization Sprint 1 runtime unless the product architecture changes.
- Validate external input with Zod schemas from `@plyco/contracts` whenever the shape crosses the API/client boundary.
- Keep Prisma and database-specific fields behind API internals and `packages/db`; do not leak them into shared DTOs or client-facing responses.
- When adding, renaming, or removing document-generation data elements, update `apps/api/data/templates/schema.json` in the same change.
- Return structured JSON errors through the existing error helpers instead of ad hoc response shapes.

## Logging

- Use Fastify's request logger (`request.log`) or the app logger. Do not use `console.log` in API code.
- Log unexpected request failures once at the central error boundary with structured fields such as `err`, `method`, and `url`.
- Avoid logging secrets, tokens, full request bodies, or raw third-party responses that may contain sensitive data.
- For upstream failures, log enough context to debug the integration, but keep client error details sanitized and bounded.

## Exception Handling

- Use `ApiError` for expected domain, validation-adjacent, not-found, and upstream failure cases that need a specific status code or error code.
- Let Zod validation errors bubble to the central error handler so clients receive the standard `VALIDATION_FAILED` shape.
- Do not catch errors in route handlers unless you are adding useful context or converting a known external failure into an `ApiError`.
- Let truly unexpected errors bubble to Fastify's central error handler, which should return `INTERNAL_SERVER_ERROR` without exposing internals.
- Startup/configuration errors may throw plain `Error` when the service cannot safely boot.

## Database Naming

- Tables: use plural nouns, such as `customers` or `orders`, to represent collections of records.
- Columns: use singular nouns, such as `first_name` or `email_address`.
- Primary keys: use `id` by default, or `{table_name}_id` when a more explicit key is needed.
- Foreign keys: use `{referenced_table_singular}_id`, such as `customer_id`.
- Timestamps: use `created_at` and `updated_at` for date-time fields.
- Constraints and indexes: use descriptive suffixes:
  - Primary key: `{table}_pkey`, such as `users_pkey`.
  - Foreign key: `{table}_{column}_fkey`.
  - Unique constraint: `{table}_{column}_key`.
  - Index: `idx_{table}_{column}`, such as `idx_users_last_name`.
  - Check constraint: `{table}_{column}_check`.
