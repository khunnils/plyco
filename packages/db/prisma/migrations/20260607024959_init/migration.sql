-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "legal_entity_name" TEXT,
    "website" TEXT,
    "contact_email" TEXT,
    "security_contact_email" TEXT,
    "privacy_contact_email" TEXT,
    "country" TEXT,
    "address" TEXT,
    "employee_count" INTEGER,
    "industries" JSONB,
    "regions" JSONB,
    "handles_pii" BOOLEAN,
    "handles_sensitive_data" BOOLEAN,
    "stores_pii" BOOLEAN,
    "stores_healthcare_data" BOOLEAN,
    "compliance_goals" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "system_code_sets" (
    "id" TEXT NOT NULL,
    "airtable_record_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_code_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_codes" (
    "id" TEXT NOT NULL,
    "code_set_id" TEXT NOT NULL,
    "airtable_record_id" TEXT NOT NULL,
    "code_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_code_sets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "system_code_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_code_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_codes" (
    "id" TEXT NOT NULL,
    "organization_code_set_id" TEXT NOT NULL,
    "system_code_id" TEXT,
    "code_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "google_subject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_name" TEXT,
    "service_description" TEXT,
    "service_url" TEXT,
    "user_types" JSONB,
    "customer_types" JSONB,
    "availability_regions" JSONB,
    "children_directed" BOOLEAN,
    "minimum_user_age" INTEGER,
    "uses_cookies_or_tracking_technologies" BOOLEAN,
    "cookie_tracking_categories" JSONB,
    "cookie_consent_mechanism" TEXT,
    "do_not_track_response" BOOLEAN,
    "global_privacy_control_supported" BOOLEAN,
    "primary_hosting_region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "supported_rights" JSONB,
    "request_methods" JSONB,
    "response_timeline_days_status" TEXT,
    "response_timeline_days" INTEGER,
    "identity_verification_required" BOOLEAN,
    "authorized_agent_supported" BOOLEAN,
    "appeal_process_exists" BOOLEAN,
    "sends_marketing_emails" BOOLEAN,
    "marketing_opt_out_method" TEXT,
    "transactional_emails_sent" BOOLEAN,
    "cross_border_transfers" BOOLEAN,
    "transfer_mechanisms" JSONB,
    "sells_or_shares_data" BOOLEAN,
    "do_not_sell_link" TEXT,
    "dpo_status" TEXT,
    "dpo_name" TEXT,
    "dpo_email" TEXT,
    "eu_representative_status" TEXT,
    "eu_representative_name" TEXT,
    "eu_representative_address" TEXT,
    "uses_automated_decision_making" BOOLEAN,
    "production_data_in_development" BOOLEAN,
    "retention_policy_exists" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "mfa_enabled" BOOLEAN,
    "encrypted_devices_required" BOOLEAN,
    "backups_enabled" BOOLEAN,
    "centralized_logging_enabled" BOOLEAN,
    "at_rest_algorithm" TEXT,
    "in_transit_minimum_tls_version" TEXT,
    "key_management_provider" TEXT,
    "log_retention_days" INTEGER,
    "log_retention_days_status" TEXT,
    "security_monitoring_owner" TEXT,
    "scanning_cadence" TEXT,
    "patching_sla_critical_days" INTEGER,
    "patching_sla_critical_days_status" TEXT,
    "patching_sla_high_days" INTEGER,
    "patching_sla_high_days_status" TEXT,
    "incident_response_plan_exists" BOOLEAN,
    "incident_notification_timeline" TEXT,
    "customer_notification_process" TEXT,
    "incident_response_last_tested_date" TEXT,
    "backup_cadence" TEXT,
    "backup_retention_days" INTEGER,
    "backup_retention_days_status" TEXT,
    "restore_testing_cadence" TEXT,
    "vendor_review_required" BOOLEAN,
    "vendor_review_cadence" TEXT,
    "dpa_required_for_processors" BOOLEAN,
    "penetration_testing_strategy" TEXT,
    "penetration_testing_cadence" TEXT,
    "penetration_test_last_date" TEXT,
    "vulnerability_disclosure_program_exists" BOOLEAN,
    "vulnerability_disclosure_url" TEXT,
    "encryption_at_rest" BOOLEAN,
    "encryption_in_transit" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_data_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject_types" JSONB,
    "collection_methods" JSONB,
    "is_sensitive" BOOLEAN,
    "is_required" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_data_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_activities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "legal_basis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retention_policy" TEXT,
    "retention_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_activity_data_types" (
    "id" TEXT NOT NULL,
    "business_activity_id" TEXT NOT NULL,
    "organization_data_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_activity_data_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_business_activities" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "business_activity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_business_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "mfa_required" BOOLEAN,
    "sso_enabled" BOOLEAN,
    "shared_accounts_exist" BOOLEAN,
    "offboarding_process_exists" BOOLEAN,
    "access_reviews_performed" BOOLEAN,
    "least_privilege" BOOLEAN,
    "role_based_access" BOOLEAN,
    "access_review_cadence" TEXT,
    "admin_approval_required" BOOLEAN,
    "password_manager_required" BOOLEAN,
    "security_training_required" BOOLEAN,
    "confidentiality_agreements_required" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_providers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider_id" TEXT,
    "system_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "country_of_registration" TEXT NOT NULL DEFAULT '',
    "criticality" TEXT NOT NULL,
    "notes" TEXT,
    "purpose" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_provider_usage" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "organization_provider_id" TEXT NOT NULL,
    "system_type" TEXT,
    "purpose" TEXT NOT NULL,
    "data_processing_level" TEXT NOT NULL DEFAULT 'limited',
    "dpa_status" TEXT,
    "data_regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_vendor_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source_system_template_slug" TEXT,
    "content" TEXT NOT NULL,
    "version_major" INTEGER NOT NULL DEFAULT 1,
    "version_minor" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rendered_content" TEXT NOT NULL,
    "pdf_object_path" TEXT,
    "source_hash" TEXT NOT NULL,
    "template_version_major" INTEGER NOT NULL DEFAULT 1,
    "template_version_minor" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_usage_data_types" (
    "id" TEXT NOT NULL,
    "service_provider_usage_id" TEXT NOT NULL,
    "organization_data_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_data_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_code_sets_airtable_record_id_key" ON "system_code_sets"("airtable_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_codes_airtable_record_id_key" ON "system_codes"("airtable_record_id");

-- CreateIndex
CREATE INDEX "idx_system_codes_code_set_id" ON "system_codes"("code_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_codes_code_set_id_code_id_key" ON "system_codes"("code_set_id", "code_id");

-- CreateIndex
CREATE INDEX "idx_organization_code_sets_organization_id" ON "organization_code_sets"("organization_id");

-- CreateIndex
CREATE INDEX "idx_organization_code_sets_system_code_set_id" ON "organization_code_sets"("system_code_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_code_sets_organization_id_system_code_set_id_key" ON "organization_code_sets"("organization_id", "system_code_set_id");

-- CreateIndex
CREATE INDEX "idx_organization_codes_organization_code_set_id" ON "organization_codes"("organization_code_set_id");

-- CreateIndex
CREATE INDEX "idx_organization_codes_system_code_id" ON "organization_codes"("system_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_codes_code_set_id_code_id_key" ON "organization_codes"("organization_code_set_id", "code_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_subject_key" ON "users"("google_subject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_organization_memberships_user_id" ON "organization_memberships"("user_id");

-- CreateIndex
CREATE INDEX "idx_organization_memberships_organization_id" ON "organization_memberships"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_user_id_organization_id_key" ON "organization_memberships"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_service_profiles_organization_id" ON "service_profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_profiles_organization_id_key" ON "privacy_profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_profiles_organization_id_key" ON "infrastructure_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_organization_data_types_organization_id" ON "organization_data_types"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_data_types_organization_id_name_key" ON "organization_data_types"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_business_activities_organization_id" ON "business_activities"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_activities_organization_id_name_key" ON "business_activities"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_business_activity_data_types_business_activity_id" ON "business_activity_data_types"("business_activity_id");

-- CreateIndex
CREATE INDEX "idx_business_activity_data_types_organization_data_type_id" ON "business_activity_data_types"("organization_data_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_activity_data_types_activity_id_data_type_id_key" ON "business_activity_data_types"("business_activity_id", "organization_data_type_id");

-- CreateIndex
CREATE INDEX "idx_service_business_activities_service_id" ON "service_business_activities"("service_id");

-- CreateIndex
CREATE INDEX "idx_service_business_activities_business_activity_id" ON "service_business_activities"("business_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_business_activities_service_id_business_activity_id_key" ON "service_business_activities"("service_id", "business_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_profiles_organization_id_key" ON "access_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_vendors_organization_id" ON "organization_providers"("organization_id");

-- CreateIndex
CREATE INDEX "idx_vendors_provider_id" ON "organization_providers"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_organization_id_name_key" ON "organization_providers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_organization_id" ON "service_provider_usage"("organization_id");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_service_id" ON "service_provider_usage"("service_id");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_vendor_id" ON "service_provider_usage"("organization_provider_id");

-- CreateIndex
CREATE INDEX "idx_service_provider_usage_system_type" ON "service_provider_usage"("system_type");

-- CreateIndex
CREATE UNIQUE INDEX "service_provider_usage_service_provider_system_key" ON "service_provider_usage"("service_id", "organization_provider_id", "system_type");

-- CreateIndex
CREATE INDEX "idx_templates_organization_id" ON "templates"("organization_id");

-- CreateIndex
CREATE INDEX "idx_templates_source_system_template_slug" ON "templates"("source_system_template_slug");

-- CreateIndex
CREATE UNIQUE INDEX "templates_organization_id_slug_key" ON "templates"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_documents_organization_id" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "idx_documents_template_id" ON "documents"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_organization_id_template_id_version_key" ON "documents"("organization_id", "template_id", "template_version_major", "template_version_minor");

-- CreateIndex
CREATE INDEX "idx_vendor_data_types_service_vendor_use_id" ON "provider_usage_data_types"("service_provider_usage_id");

-- CreateIndex
CREATE INDEX "idx_vendor_data_types_organization_data_type_id" ON "provider_usage_data_types"("organization_data_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_data_types_use_id_data_type_id_key" ON "provider_usage_data_types"("service_provider_usage_id", "organization_data_type_id");

-- AddForeignKey
ALTER TABLE "system_codes" ADD CONSTRAINT "system_codes_code_set_id_fkey" FOREIGN KEY ("code_set_id") REFERENCES "system_code_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_code_sets" ADD CONSTRAINT "organization_code_sets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_code_sets" ADD CONSTRAINT "organization_code_sets_system_code_set_id_fkey" FOREIGN KEY ("system_code_set_id") REFERENCES "system_code_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_codes" ADD CONSTRAINT "organization_codes_organization_code_set_id_fkey" FOREIGN KEY ("organization_code_set_id") REFERENCES "organization_code_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_profiles" ADD CONSTRAINT "service_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_profiles" ADD CONSTRAINT "privacy_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_profiles" ADD CONSTRAINT "infrastructure_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_data_types" ADD CONSTRAINT "organization_data_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_activities" ADD CONSTRAINT "business_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_activity_data_types" ADD CONSTRAINT "business_activity_data_types_business_activity_id_fkey" FOREIGN KEY ("business_activity_id") REFERENCES "business_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_activity_data_types" ADD CONSTRAINT "business_activity_data_types_organization_data_type_id_fkey" FOREIGN KEY ("organization_data_type_id") REFERENCES "organization_data_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_business_activities" ADD CONSTRAINT "service_business_activities_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_business_activities" ADD CONSTRAINT "service_business_activities_business_activity_id_fkey" FOREIGN KEY ("business_activity_id") REFERENCES "business_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_profiles" ADD CONSTRAINT "access_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_providers" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_usage" ADD CONSTRAINT "service_vendor_uses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_usage" ADD CONSTRAINT "service_vendor_uses_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_usage" ADD CONSTRAINT "service_vendor_uses_vendor_id_fkey" FOREIGN KEY ("organization_provider_id") REFERENCES "organization_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_usage_data_types" ADD CONSTRAINT "vendor_data_types_service_vendor_use_id_fkey" FOREIGN KEY ("service_provider_usage_id") REFERENCES "service_provider_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_usage_data_types" ADD CONSTRAINT "vendor_data_types_organization_data_type_id_fkey" FOREIGN KEY ("organization_data_type_id") REFERENCES "organization_data_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
