-- Move service-specific privacy settings from the organization privacy profile
-- onto each service profile.
ALTER TABLE "service_profiles"
  ADD COLUMN "uses_cookies" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cookie_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "primary_hosting_region" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "data_residency_options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "service_profiles" AS service
SET
  "uses_cookies" = privacy."uses_cookies",
  "cookie_types" = privacy."cookie_types",
  "primary_hosting_region" = privacy."primary_hosting_region",
  "data_residency_options" = privacy."data_residency_options"
FROM "privacy_profiles" AS privacy
WHERE privacy."organization_id" = service."organization_id";

-- Existing analytics/advertising provider selections were organization-level;
-- copy them to every existing service before removing that interpretation.
INSERT INTO "organization_providers" (
  "id",
  "organization_id",
  "service_id",
  "provider_id",
  "system_type",
  "name",
  "category",
  "purpose",
  "country_of_registration",
  "has_subprocessors",
  "data_processing_level",
  "dpa_status",
  "data_regions",
  "criticality",
  "owner",
  "notes",
  "created_at",
  "updated_at"
)
SELECT
  provider."id" || '_' || service."id",
  provider."organization_id",
  service."id",
  provider."provider_id",
  provider."system_type",
  provider."name",
  provider."category",
  provider."purpose",
  provider."country_of_registration",
  provider."has_subprocessors",
  provider."data_processing_level",
  provider."dpa_status",
  provider."data_regions",
  provider."criticality",
  provider."owner",
  provider."notes",
  provider."created_at",
  provider."updated_at"
FROM "organization_providers" AS provider
JOIN "service_profiles" AS service
  ON service."organization_id" = provider."organization_id"
WHERE provider."service_id" IS NULL
  AND provider."system_type" IN ('analytics', 'advertising');

DELETE FROM "organization_providers"
WHERE "service_id" IS NULL
  AND "system_type" IN ('analytics', 'advertising');

ALTER TABLE "privacy_profiles"
  DROP COLUMN "uses_cookies",
  DROP COLUMN "cookie_types",
  DROP COLUMN "primary_hosting_region",
  DROP COLUMN "data_residency_options";

-- Data sharing is represented through vendors/subprocessors.
ALTER TABLE "organization_data_types"
  DROP COLUMN "shared_with_third_parties",
  DROP COLUMN "third_parties";

-- Additional vendor/subprocessor metadata.
ALTER TABLE "organization_providers"
  ADD COLUMN "legal_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "display_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "provider_organization_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "provider_organization_legal_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "privacy_policy_url" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "dpa_url" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "security_page_url" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "organization_providers_org_system_provider_key";

CREATE UNIQUE INDEX "organization_providers_org_service_system_provider_key"
  ON "organization_providers"("organization_id", "service_id", "system_type", "provider_id");
