-- AlterTable
ALTER TABLE "business_activities" ADD COLUMN     "retention_days_status" TEXT;

-- AlterTable
ALTER TABLE "infrastructure_profiles" ADD COLUMN     "backup_retention_days_status" TEXT,
ADD COLUMN     "log_retention_days_status" TEXT,
ADD COLUMN     "patching_sla_critical_days_status" TEXT,
ADD COLUMN     "patching_sla_high_days_status" TEXT;
