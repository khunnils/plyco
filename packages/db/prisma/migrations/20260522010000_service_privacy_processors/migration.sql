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

-- Additional provider/vendor metadata kept for existing provider rows and
-- moved into normalized vendor rows below.
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

CREATE TABLE "business_activities" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "purposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "legal_basis" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "business_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "business_activities_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "business_activities_organization_id_name_key"
  ON "business_activities"("organization_id", "name");
CREATE INDEX "idx_business_activities_organization_id"
  ON "business_activities"("organization_id");

CREATE TABLE "service_business_activities" (
  "id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "business_activity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_business_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_business_activities_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_business_activities_business_activity_id_fkey"
    FOREIGN KEY ("business_activity_id") REFERENCES "business_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "service_business_activities_service_id_business_activity_id_key"
  ON "service_business_activities"("service_id", "business_activity_id");
CREATE INDEX "idx_service_business_activities_service_id"
  ON "service_business_activities"("service_id");
CREATE INDEX "idx_service_business_activities_business_activity_id"
  ON "service_business_activities"("business_activity_id");

INSERT INTO "business_activities" (
  "id",
  "organization_id",
  "name",
  "description",
  "purposes",
  "legal_basis",
  "created_at",
  "updated_at"
)
SELECT
  'activity_' || md5("organization_id" || '|' || "name"),
  "organization_id",
  'Process ' || "name",
  "description",
  CASE
    WHEN btrim("purposes") = '' THEN ARRAY[]::TEXT[]
    ELSE regexp_split_to_array(regexp_replace("purposes", '\s+', '', 'g'), ',')
  END,
  "legal_basis",
  "created_at",
  "updated_at"
FROM "organization_data_types"
WHERE btrim("purposes") <> ''
  OR cardinality("legal_basis") > 0
ON CONFLICT ("organization_id", "name") DO NOTHING;

INSERT INTO "service_business_activities" (
  "id",
  "service_id",
  "business_activity_id",
  "created_at",
  "updated_at"
)
SELECT
  'service_activity_' || md5(service."id" || '|' || activity."id"),
  service."id",
  activity."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "service_profiles" AS service
JOIN "business_activities" AS activity
  ON activity."organization_id" = service."organization_id"
ON CONFLICT ("service_id", "business_activity_id") DO NOTHING;

ALTER TABLE "organization_data_types"
  DROP COLUMN "purposes",
  DROP COLUMN "legal_basis",
  DROP COLUMN IF EXISTS "shared_with_third_parties",
  DROP COLUMN IF EXISTS "third_parties";

CREATE TABLE "vendors" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "provider_id" TEXT,
  "name" TEXT NOT NULL,
  "legal_name" TEXT NOT NULL DEFAULT '',
  "display_name" TEXT NOT NULL DEFAULT '',
  "provider_organization_name" TEXT NOT NULL DEFAULT '',
  "provider_organization_legal_name" TEXT NOT NULL DEFAULT '',
  "privacy_policy_url" TEXT NOT NULL DEFAULT '',
  "dpa_url" TEXT NOT NULL DEFAULT '',
  "security_page_url" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL,
  "country_of_registration" TEXT NOT NULL DEFAULT '',
  "has_subprocessors" BOOLEAN NOT NULL DEFAULT false,
  "criticality" TEXT NOT NULL,
  "owner" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vendors_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "vendors_organization_id_name_key"
  ON "vendors"("organization_id", "name");
CREATE INDEX "idx_vendors_organization_id" ON "vendors"("organization_id");
CREATE INDEX "idx_vendors_provider_id" ON "vendors"("provider_id");

CREATE TABLE "service_vendor_uses" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "data_processing_level" TEXT NOT NULL DEFAULT 'limited',
  "dpa_status" TEXT NOT NULL,
  "data_regions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_vendor_uses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_vendor_uses_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_vendor_uses_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_vendor_uses_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "service_vendor_uses_service_id_vendor_id_key"
  ON "service_vendor_uses"("service_id", "vendor_id");
CREATE INDEX "idx_service_vendor_uses_organization_id"
  ON "service_vendor_uses"("organization_id");
CREATE INDEX "idx_service_vendor_uses_service_id"
  ON "service_vendor_uses"("service_id");
CREATE INDEX "idx_service_vendor_uses_vendor_id"
  ON "service_vendor_uses"("vendor_id");

INSERT INTO "vendors" (
  "id",
  "organization_id",
  "provider_id",
  "name",
  "legal_name",
  "display_name",
  "provider_organization_name",
  "provider_organization_legal_name",
  "privacy_policy_url",
  "dpa_url",
  "security_page_url",
  "category",
  "country_of_registration",
  "has_subprocessors",
  "criticality",
  "owner",
  "notes",
  "created_at",
  "updated_at"
)
SELECT DISTINCT ON (provider."organization_id", provider."name")
  'vendor_' || md5(provider."organization_id" || '|' || provider."name"),
  provider."organization_id",
  provider."provider_id",
  provider."name",
  provider."legal_name",
  provider."display_name",
  provider."provider_organization_name",
  provider."provider_organization_legal_name",
  provider."privacy_policy_url",
  provider."dpa_url",
  provider."security_page_url",
  provider."category",
  provider."country_of_registration",
  provider."has_subprocessors",
  provider."criticality",
  provider."owner",
  provider."notes",
  provider."created_at",
  provider."updated_at"
FROM "organization_providers" AS provider
WHERE provider."system_type" IS NULL
ORDER BY provider."organization_id", provider."name", provider."created_at";

INSERT INTO "service_vendor_uses" (
  "id",
  "organization_id",
  "service_id",
  "vendor_id",
  "purpose",
  "data_processing_level",
  "dpa_status",
  "data_regions",
  "notes",
  "created_at",
  "updated_at"
)
SELECT
  'vendor_use_' || md5(provider."id"),
  provider."organization_id",
  provider."service_id",
  vendor."id",
  provider."purpose",
  provider."data_processing_level",
  provider."dpa_status",
  provider."data_regions",
  provider."notes",
  provider."created_at",
  provider."updated_at"
FROM "organization_providers" AS provider
JOIN "vendors" AS vendor
  ON vendor."organization_id" = provider."organization_id"
 AND vendor."name" = provider."name"
WHERE provider."system_type" IS NULL
  AND provider."service_id" IS NOT NULL
ON CONFLICT ("service_id", "vendor_id") DO NOTHING;

ALTER TABLE "vendor_data_types"
  ADD COLUMN "service_vendor_use_id" TEXT;

UPDATE "vendor_data_types" AS data_type
SET "service_vendor_use_id" = 'vendor_use_' || md5(data_type."vendor_id")
WHERE EXISTS (
  SELECT 1
  FROM "service_vendor_uses" AS vendor_use
  WHERE vendor_use."id" = 'vendor_use_' || md5(data_type."vendor_id")
);

ALTER TABLE "vendor_data_types"
  DROP CONSTRAINT "vendor_data_types_vendor_id_fkey",
  DROP COLUMN "vendor_id",
  ALTER COLUMN "service_vendor_use_id" SET NOT NULL,
  ADD CONSTRAINT "vendor_data_types_service_vendor_use_id_fkey"
    FOREIGN KEY ("service_vendor_use_id") REFERENCES "service_vendor_uses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "vendor_data_types_vendor_id_organization_data_type_id_key";
DROP INDEX IF EXISTS "idx_vendor_data_types_vendor_id";

CREATE UNIQUE INDEX "vendor_data_types_use_id_data_type_id_key"
  ON "vendor_data_types"("service_vendor_use_id", "organization_data_type_id");
CREATE INDEX "idx_vendor_data_types_service_vendor_use_id"
  ON "vendor_data_types"("service_vendor_use_id");

DELETE FROM "organization_providers"
WHERE "system_type" IS NULL;
