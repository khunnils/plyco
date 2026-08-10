-- AlterTable
ALTER TABLE "organization_api_keys" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'read';
