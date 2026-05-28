-- DropIndex
DROP INDEX "documents_organization_id_template_id_key";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "template_version_major" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "template_version_minor" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "documents_organization_id_template_id_version_key" ON "documents"("organization_id", "template_id", "template_version_major", "template_version_minor");

-- AlterTable
ALTER TABLE "service_provider_usage" ALTER COLUMN "dpa_status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "policy_version",
ADD COLUMN "version_major" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "version_minor" INTEGER NOT NULL DEFAULT 0;
