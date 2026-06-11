CREATE TABLE "security_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code_review_required" BOOLEAN,
    "dependency_security_monitoring" BOOLEAN,
    "secret_scanning" BOOLEAN,
    "automated_testing_before_deployment" BOOLEAN,
    "cicd_deployment_process" BOOLEAN,
    "production_deployment_approval_required" BOOLEAN,
    "scanning_cadence" TEXT,
    "penetration_testing_strategy" TEXT,
    "penetration_testing_cadence" TEXT,
    "penetration_test_last_date" TEXT,
    "patching_sla_critical_days" INTEGER,
    "patching_sla_critical_days_status" TEXT,
    "patching_sla_high_days" INTEGER,
    "patching_sla_high_days_status" TEXT,
    "vulnerability_disclosure_program_exists" BOOLEAN,
    "vulnerability_disclosure_url" TEXT,
    "incident_response_plan_exists" BOOLEAN,
    "incident_notification_timeline" TEXT,
    "customer_notification_process" TEXT,
    "incident_response_last_tested_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_profiles_organization_id_key" ON "security_profiles"("organization_id");

ALTER TABLE "security_profiles" ADD CONSTRAINT "security_profiles_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "security_profiles" (
    "id", "organization_id", "scanning_cadence", "penetration_testing_strategy",
    "penetration_testing_cadence", "penetration_test_last_date",
    "patching_sla_critical_days", "patching_sla_critical_days_status",
    "patching_sla_high_days", "patching_sla_high_days_status",
    "vulnerability_disclosure_program_exists", "vulnerability_disclosure_url",
    "incident_response_plan_exists", "incident_notification_timeline",
    "customer_notification_process", "incident_response_last_tested_date",
    "created_at", "updated_at"
)
SELECT
    'security_' || "id", "organization_id", "scanning_cadence", "penetration_testing_strategy",
    "penetration_testing_cadence", "penetration_test_last_date",
    "patching_sla_critical_days", "patching_sla_critical_days_status",
    "patching_sla_high_days", "patching_sla_high_days_status",
    "vulnerability_disclosure_program_exists", "vulnerability_disclosure_url",
    "incident_response_plan_exists", "incident_notification_timeline",
    "customer_notification_process", "incident_response_last_tested_date",
    "created_at", "updated_at"
FROM "infrastructure_profiles";

ALTER TABLE "infrastructure_profiles"
ADD COLUMN "security_monitoring" TEXT,
DROP COLUMN "log_retention_days",
DROP COLUMN "log_retention_days_status",
DROP COLUMN "security_monitoring_owner",
DROP COLUMN "scanning_cadence",
DROP COLUMN "penetration_testing_strategy",
DROP COLUMN "penetration_testing_cadence",
DROP COLUMN "penetration_test_last_date",
DROP COLUMN "patching_sla_critical_days",
DROP COLUMN "patching_sla_critical_days_status",
DROP COLUMN "patching_sla_high_days",
DROP COLUMN "patching_sla_high_days_status",
DROP COLUMN "vulnerability_disclosure_program_exists",
DROP COLUMN "vulnerability_disclosure_url",
DROP COLUMN "incident_response_plan_exists",
DROP COLUMN "incident_notification_timeline",
DROP COLUMN "customer_notification_process",
DROP COLUMN "incident_response_last_tested_date";
