ALTER TABLE "infrastructure_profiles"
ADD COLUMN "explicit_no_provider_system_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "infrastructure_profiles" AS infrastructure
SET "explicit_no_provider_system_types" = explicit_none."system_types"
FROM (
    SELECT
        provider."organization_id",
        ARRAY_AGG(DISTINCT system_type) AS "system_types"
    FROM "organization_providers" AS provider
    CROSS JOIN LATERAL UNNEST(provider."system_types") AS selected(system_type)
    WHERE provider."provider_id" = 'none'
      AND system_type IN ('cloud', 'source_control', 'auth', 'password_manager')
    GROUP BY provider."organization_id"
) AS explicit_none
WHERE infrastructure."organization_id" = explicit_none."organization_id";

DELETE FROM "organization_providers"
WHERE "provider_id" = 'none';
