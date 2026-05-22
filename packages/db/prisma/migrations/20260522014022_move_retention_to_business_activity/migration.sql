/*
  Warnings:

  - You are about to drop the column `retention_days` on the `organization_data_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_activities" ADD COLUMN     "retention_days" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "organization_data_types" DROP COLUMN "retention_days";
