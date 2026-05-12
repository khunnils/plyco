## Coding Conventions
 - Use arrow functions instead of function()
 - Each component in separate file

## Data handling
 - Use TanStack query for fetching, caching, invalidation, optimistic updates, and loading/error states.

## Form handling
 - Ueact React Hook Form + Zod for validation with shared schemas

## Data handling
 - Server state: TanStack Query
 - UI state: local component state first, Zustand when needed (global)
 - API client: typed fetch wrapper