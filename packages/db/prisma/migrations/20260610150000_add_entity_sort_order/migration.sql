ALTER TABLE "service_profiles"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "organization_data_types"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "business_activities"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY organization_id ORDER BY created_at, id
  ) - 1 AS position
  FROM service_profiles
)
UPDATE service_profiles
SET sort_order = ranked.position
FROM ranked
WHERE service_profiles.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY organization_id ORDER BY created_at, id
  ) - 1 AS position
  FROM organization_data_types
)
UPDATE organization_data_types
SET sort_order = ranked.position
FROM ranked
WHERE organization_data_types.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY organization_id ORDER BY created_at, id
  ) - 1 AS position
  FROM business_activities
)
UPDATE business_activities
SET sort_order = ranked.position
FROM ranked
WHERE business_activities.id = ranked.id;

CREATE INDEX "idx_service_profiles_organization_id_sort_order"
ON "service_profiles"("organization_id", "sort_order");

CREATE INDEX "idx_organization_data_types_organization_id_sort_order"
ON "organization_data_types"("organization_id", "sort_order");

CREATE INDEX "idx_business_activities_organization_id_sort_order"
ON "business_activities"("organization_id", "sort_order");
