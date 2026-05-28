-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "policy_effective_date" TEXT;

-- AlterTable
ALTER TABLE "infrastructure_profiles" ADD COLUMN     "penetration_testing_cadence" TEXT,
ADD COLUMN     "penetration_test_last_date" TEXT,
ADD COLUMN     "vulnerability_disclosure_program_exists" BOOLEAN,
ADD COLUMN     "vulnerability_disclosure_url" TEXT;

-- AlterTable
ALTER TABLE "access_profiles" ADD COLUMN     "security_training_required" BOOLEAN,
ADD COLUMN     "confidentiality_agreements_required" BOOLEAN;
