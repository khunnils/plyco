# Database Package Architecture

`@complyflow/db` owns Prisma and database mapping.

Sprint 1 stores one organization security profile and related vendors. Profile sections are JSON columns validated at API boundaries with shared Zod schemas. Vendor inventory is relational so vendors can be added, edited, and removed independently.
