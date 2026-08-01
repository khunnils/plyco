ALTER TABLE "organizations" DROP COLUMN "handles_pii";
ALTER TABLE "organizations" RENAME COLUMN "stores_pii" TO "handles_personal_data";
ALTER TABLE "organizations" RENAME COLUMN "stores_healthcare_data" TO "handles_health_data";
