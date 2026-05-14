ALTER TABLE "vendors" RENAME TO "organization_providers";

ALTER INDEX "vendors_pkey" RENAME TO "organization_providers_pkey";
ALTER INDEX "idx_vendors_organization_id" RENAME TO "idx_organization_providers_organization_id";

ALTER TABLE "organization_providers"
  ADD COLUMN "provider_id" TEXT,
  ADD COLUMN "system_type" TEXT;

CREATE INDEX "idx_organization_providers_provider_id" ON "organization_providers"("provider_id");
CREATE INDEX "idx_organization_providers_system_type" ON "organization_providers"("system_type");
CREATE UNIQUE INDEX "organization_providers_org_system_provider_key"
  ON "organization_providers"("organization_id", "system_type", "provider_id");

ALTER TABLE "infrastructure_profiles"
  DROP COLUMN "cloud_providers",
  DROP COLUMN "source_control_provider",
  DROP COLUMN "auth_provider",
  DROP COLUMN "password_manager";
