## ComplyFlow - Agent Instructions

## Key principles

1. Don’t assume. Don’t hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Define success criteria. Loop until verified.


## Canonical Docs

Read these before making broad repository changes:

- High-level architecture: `docs/architecture.md`
- UX guidelines: `docs/ux-guidelines.md`
- Product spec: `docs/spec.md`

## Repository Rules

- This is a TypeScript pnpm workspace monorepo.
- Keep implementation aligned with the architecture docs. Update docs in the same change when architecture or workflow assumptions change.
- Do not commit to Git automatically until explicitly prompted.
- Git commit messages must use a conventional prefix, such as `chore:`, `fix:`, `feature(client):`, `feature(api):`, `docs:`, or `refactor(tools):`.
- Git commit message should include detailed message unless trivial change
- Prefer small, focused changes that preserve module boundaries.

## Documentation Pattern

- Keep repo-wide architecture in `docs/architecture.md`.
- Keep module-specific architecture under that module's `docs/architecture.md`.
- Keep user-facing product behavior in `docs/spec.md`.
- Keep visual and UX rules in `docs/design.md`.
- When moving responsibilities between modules, update both the source module doc and the target module doc.

## Coding comments
- Comments should be added where they make sense, i.e auth or complicated logic.
- No not comment basics like CRUD operations


## Coding Standards

- Use TypeScript with strict types.
- Use shared DTOs, Zod schemas, and enums from `packages/shared` for cross-boundary contracts.
- Keep Prisma and DB-only fields inside `packages/db` and API internals.
- Validate external inputs with Zod or framework-level schema validation.
- Return structured errors from API code.
- Add meaningful comments for non-obvious decisions, invariants, or domain rules.
- Do not comment obvious code such as simple assignments, basic CRUD calls, or direct function calls.
- Don't add unnecessary compatibility layers or checks
