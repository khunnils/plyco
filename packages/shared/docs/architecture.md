# Shared Package Architecture

`@plyco/shared` owns API-facing contracts only.

It contains Zod schemas, enums, DTO types, and empty profile defaults used by the API and client, including the security snapshot, persisted organization data-type IDs, business activity data-type mappings, vendor master, service-vendor-use, provider, template, and generated document contracts. It must not contain Prisma models, database-only fields, secrets, or provider-specific implementation details.
