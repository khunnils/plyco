ALTER TABLE "privacy_profiles" RENAME COLUMN "data_transfer_mechanisms" TO "transfer_mechanisms";

UPDATE "privacy_profiles"
SET "transfer_mechanisms" = ARRAY[]::TEXT[]
WHERE "transfer_mechanisms" IS NULL;

ALTER TABLE "privacy_profiles" ALTER COLUMN "transfer_mechanisms" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "privacy_profiles" ALTER COLUMN "transfer_mechanisms" SET NOT NULL;

ALTER TABLE "privacy_profiles" ADD COLUMN "cross_border_transfers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "privacy_profiles" ADD COLUMN "primary_hosting_region" TEXT NOT NULL DEFAULT '';
ALTER TABLE "privacy_profiles" ADD COLUMN "data_residency_options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
