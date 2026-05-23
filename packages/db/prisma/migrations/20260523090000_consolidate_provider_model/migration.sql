-- Preserve the old system-provider selection table while the canonical
-- inventory table takes over its final name.
ALTER TABLE "organization_providers" RENAME TO "organization_provider_selections";
ALTER TABLE "vendors" RENAME TO "organization_providers";
ALTER TABLE "service_vendor_uses" RENAME TO "service_provider_usage";
ALTER TABLE "vendor_data_types" RENAME TO "provider_usage_data_types";

ALTER TABLE "organization_providers"
  ADD COLUMN "system_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "service_provider_usage"
  ADD COLUMN "system_type" TEXT;

ALTER TABLE "service_provider_usage"
  RENAME COLUMN "vendor_id" TO "organization_provider_id";

ALTER TABLE "provider_usage_data_types"
  RENAME COLUMN "service_vendor_use_id" TO "service_provider_usage_id";

-- Add catalog providers from the old selection table to the organization
-- inventory when they do not already exist there.
INSERT INTO "organization_providers" (
  "id",
  "organization_id",
  "provider_id",
  "system_types",
  "name",
  "legal_name",
  "category",
  "country_of_registration",
  "criticality",
  "notes",
  "created_at",
  "updated_at"
)
SELECT DISTINCT ON (selection."organization_id", selection."name")
  'provider_' || md5(random()::text || clock_timestamp()::text),
  selection."organization_id",
  selection."provider_id",
  ARRAY[]::TEXT[],
  selection."name",
  selection."legal_name",
  selection."category",
  selection."country_of_registration",
  selection."criticality",
  selection."notes",
  selection."created_at",
  selection."updated_at"
FROM "organization_provider_selections" selection
WHERE NOT EXISTS (
  SELECT 1
  FROM "organization_providers" provider
  WHERE provider."organization_id" = selection."organization_id"
    AND (
      provider."name" = selection."name"
      OR (selection."provider_id" IS NOT NULL AND provider."provider_id" = selection."provider_id")
    )
)
ORDER BY selection."organization_id", selection."name", selection."provider_id" ASC NULLS LAST, selection."created_at" DESC;

-- Fold organization-level infrastructure/newsletter roles into inventory rows.
WITH selected_systems AS (
  SELECT
    provider."id",
    array_agg(DISTINCT selection."system_type") FILTER (
      WHERE selection."system_type" IN (
        'auth',
        'source_control',
        'cloud',
        'password_manager',
        'newsletter'
      )
    ) AS system_types
  FROM "organization_provider_selections" selection
  JOIN "organization_providers" provider
    ON provider."organization_id" = selection."organization_id"
   AND (
      provider."name" = selection."name"
      OR (selection."provider_id" IS NOT NULL AND provider."provider_id" = selection."provider_id")
   )
  WHERE selection."service_id" IS NULL
  GROUP BY provider."id"
)
UPDATE "organization_providers" provider
SET "system_types" = COALESCE(selected_systems."system_types", ARRAY[]::TEXT[])
FROM selected_systems
WHERE provider."id" = selected_systems."id";

-- Move service-scoped analytics/advertising selections into service usage.
INSERT INTO "service_provider_usage" (
  "id",
  "organization_id",
  "service_id",
  "organization_provider_id",
  "system_type",
  "purpose",
  "data_processing_level",
  "dpa_status",
  "data_regions",
  "notes",
  "created_at",
  "updated_at"
)
SELECT DISTINCT ON (selection."service_id", provider."id", selection."system_type")
  'provider_usage_' || md5(random()::text || clock_timestamp()::text),
  selection."organization_id",
  selection."service_id",
  provider."id",
  selection."system_type",
  selection."purpose",
  selection."data_processing_level",
  selection."dpa_status",
  selection."data_regions",
  selection."notes",
  selection."created_at",
  selection."updated_at"
FROM "organization_provider_selections" selection
JOIN "organization_providers" provider
  ON provider."organization_id" = selection."organization_id"
 AND (
    provider."name" = selection."name"
    OR (selection."provider_id" IS NOT NULL AND provider."provider_id" = selection."provider_id")
 )
WHERE selection."service_id" IS NOT NULL
  AND selection."system_type" IN ('analytics', 'advertising')
  AND NOT EXISTS (
    SELECT 1
    FROM "service_provider_usage" usage
    WHERE usage."service_id" = selection."service_id"
      AND usage."organization_provider_id" = provider."id"
      AND usage."system_type" = selection."system_type"
  )
ORDER BY selection."service_id", provider."id", selection."system_type", selection."created_at" DESC;

DROP INDEX IF EXISTS "service_vendor_uses_service_id_vendor_id_key";
CREATE UNIQUE INDEX "service_provider_usage_service_provider_system_key"
  ON "service_provider_usage"("service_id", "organization_provider_id", "system_type");

DROP INDEX IF EXISTS "idx_service_vendor_uses_vendor_id";
CREATE INDEX "idx_service_provider_usage_organization_provider_id"
  ON "service_provider_usage"("organization_provider_id");

CREATE INDEX "idx_service_provider_usage_system_type"
  ON "service_provider_usage"("system_type");

ALTER TABLE "organization_providers"
  DROP COLUMN "display_name",
  DROP COLUMN "provider_organization_name",
  DROP COLUMN "provider_organization_legal_name",
  DROP COLUMN "privacy_policy_url",
  DROP COLUMN "dpa_url",
  DROP COLUMN "security_page_url",
  DROP COLUMN "has_subprocessors",
  DROP COLUMN "owner";

DROP TABLE "organization_provider_selections";
