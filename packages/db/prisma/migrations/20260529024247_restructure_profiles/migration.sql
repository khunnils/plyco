/*
  Warnings:

  - You are about to drop the `data_handling_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "data_handling_profiles" DROP CONSTRAINT "data_handling_profiles_organization_id_fkey";

-- AlterTable
ALTER TABLE "infrastructure_profiles" ADD COLUMN     "encryption_at_rest" BOOLEAN,
ADD COLUMN     "encryption_in_transit" BOOLEAN,
ADD COLUMN     "penetration_testing_strategy" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "stores_healthcare_data" BOOLEAN,
ADD COLUMN     "stores_pii" BOOLEAN;

-- AlterTable
ALTER TABLE "privacy_profiles" ADD COLUMN     "production_data_in_development" BOOLEAN,
ADD COLUMN     "retention_policy_exists" BOOLEAN;

-- DropTable
DROP TABLE "data_handling_profiles";
