-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "legal_entity_name" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "contact_email" TEXT NOT NULL DEFAULT '',
    "security_contact_email" TEXT NOT NULL DEFAULT '',
    "privacy_contact_email" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "employee_count" INTEGER NOT NULL,
    "industries" TEXT[],
    "regions" TEXT[],
    "handles_pii" BOOLEAN NOT NULL,
    "handles_sensitive_data" BOOLEAN NOT NULL,
    "compliance_goals" TEXT[],
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
    "service_name" TEXT NOT NULL DEFAULT '',
    "service_description" TEXT NOT NULL DEFAULT '',
    "service_url" TEXT NOT NULL DEFAULT '',
    "user_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customer_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability_regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "children_directed" BOOLEAN NOT NULL DEFAULT false,
    "minimum_user_age" INTEGER NOT NULL DEFAULT 0,
    "uses_cookies" BOOLEAN NOT NULL DEFAULT false,
    "cookie_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_hosting_region" TEXT NOT NULL DEFAULT '',
    "data_residency_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "supported_rights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "request_methods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "response_timeline_days" INTEGER NOT NULL DEFAULT 0,
    "identity_verification_required" BOOLEAN NOT NULL DEFAULT false,
    "authorized_agent_supported" BOOLEAN NOT NULL DEFAULT false,
    "appeal_process_exists" BOOLEAN NOT NULL DEFAULT false,
    "cookie_consent_mechanism" TEXT NOT NULL DEFAULT '',
    "do_not_track_response" BOOLEAN NOT NULL DEFAULT false,
    "global_privacy_control_supported" BOOLEAN NOT NULL DEFAULT false,
    "sends_marketing_emails" BOOLEAN NOT NULL DEFAULT false,
    "marketing_opt_out_method" TEXT NOT NULL DEFAULT '',
    "transactional_emails_sent" BOOLEAN NOT NULL DEFAULT false,
    "cross_border_transfers" BOOLEAN NOT NULL DEFAULT false,
    "transfer_mechanisms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sells_or_shares_data" BOOLEAN NOT NULL DEFAULT false,
    "do_not_sell_link" TEXT NOT NULL DEFAULT '',
    "dpo_name" TEXT NOT NULL DEFAULT '',
    "dpo_email" TEXT NOT NULL DEFAULT '',
    "eu_representative_name" TEXT NOT NULL DEFAULT '',
    "eu_representative_address" TEXT NOT NULL DEFAULT '',
    "uses_automated_decision_making" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "mfa_enabled" BOOLEAN NOT NULL,
    "encrypted_devices_required" BOOLEAN NOT NULL,
    "backups_enabled" BOOLEAN NOT NULL,
    "centralized_logging_enabled" BOOLEAN NOT NULL,
    "at_rest_algorithm" TEXT NOT NULL DEFAULT '',
    "in_transit_minimum_tls_version" TEXT NOT NULL DEFAULT '',
    "key_management_provider" TEXT NOT NULL DEFAULT '',
    "log_retention_days" INTEGER NOT NULL DEFAULT 0,
    "security_monitoring_owner" TEXT NOT NULL DEFAULT '',
    "scanning_cadence" TEXT NOT NULL DEFAULT '',
    "patching_sla_critical_days" INTEGER NOT NULL DEFAULT 0,
    "patching_sla_high_days" INTEGER NOT NULL DEFAULT 0,
    "incident_response_plan_exists" BOOLEAN NOT NULL DEFAULT false,
    "incident_notification_timeline" TEXT NOT NULL DEFAULT '',
    "customer_notification_process" TEXT NOT NULL DEFAULT '',
    "incident_response_last_tested_date" TEXT NOT NULL DEFAULT '',
    "backup_cadence" TEXT NOT NULL DEFAULT '',
    "backup_retention_days" INTEGER NOT NULL DEFAULT 0,
    "restore_testing_cadence" TEXT NOT NULL DEFAULT '',
    "vendor_review_required" BOOLEAN NOT NULL DEFAULT false,
    "vendor_review_cadence" TEXT NOT NULL DEFAULT '',
    "dpa_required_for_processors" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_handling_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stores_pii" BOOLEAN NOT NULL,
    "stores_healthcare_data" BOOLEAN NOT NULL,
    "encryption_at_rest" BOOLEAN NOT NULL,
    "encryption_in_transit" BOOLEAN NOT NULL,
    "production_data_in_development" BOOLEAN NOT NULL,
    "retention_policy_exists" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_handling_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_data_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collection_methods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retention_days" INTEGER NOT NULL DEFAULT 0,
    "is_sensitive" BOOLEAN NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_activities_pkey" PRIMARY KEY ("id")
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
    "mfa_required" BOOLEAN NOT NULL,
    "sso_enabled" BOOLEAN NOT NULL,
    "shared_accounts_exist" BOOLEAN NOT NULL,
    "offboarding_process_exists" BOOLEAN NOT NULL,
    "access_reviews_performed" BOOLEAN NOT NULL,
    "privileged_access_restricted" BOOLEAN NOT NULL,
    "least_privilege" BOOLEAN NOT NULL DEFAULT false,
    "role_based_access" BOOLEAN NOT NULL DEFAULT false,
    "access_review_cadence" TEXT NOT NULL DEFAULT '',
    "admin_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "password_manager_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_providers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_id" TEXT,
    "provider_id" TEXT,
    "system_type" TEXT,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL DEFAULT '',
    "display_name" TEXT NOT NULL DEFAULT '',
    "provider_organization_name" TEXT NOT NULL DEFAULT '',
    "provider_organization_legal_name" TEXT NOT NULL DEFAULT '',
    "privacy_policy_url" TEXT NOT NULL DEFAULT '',
    "dpa_url" TEXT NOT NULL DEFAULT '',
    "security_page_url" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "country_of_registration" TEXT NOT NULL DEFAULT '',
    "has_subprocessors" BOOLEAN NOT NULL,
    "data_processing_level" TEXT NOT NULL DEFAULT 'limited',
    "dpa_status" TEXT NOT NULL,
    "data_regions" TEXT[],
    "criticality" TEXT NOT NULL,
    "owner" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider_id" TEXT,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL DEFAULT '',
    "display_name" TEXT NOT NULL DEFAULT '',
    "provider_organization_name" TEXT NOT NULL DEFAULT '',
    "provider_organization_legal_name" TEXT NOT NULL DEFAULT '',
    "privacy_policy_url" TEXT NOT NULL DEFAULT '',
    "dpa_url" TEXT NOT NULL DEFAULT '',
    "security_page_url" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "country_of_registration" TEXT NOT NULL DEFAULT '',
    "has_subprocessors" BOOLEAN NOT NULL DEFAULT false,
    "criticality" TEXT NOT NULL,
    "owner" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_vendor_uses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "data_processing_level" TEXT NOT NULL DEFAULT 'limited',
    "dpa_status" TEXT NOT NULL,
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
    "source_system_template_slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "policy_effective_date" TEXT NOT NULL DEFAULT '',
    "policy_last_reviewed_date" TEXT NOT NULL DEFAULT '',
    "policy_version" TEXT NOT NULL DEFAULT '',
    "policy_owner_user_id" TEXT,
    "policy_approver_user_id" TEXT,
    "policy_review_cadence" TEXT NOT NULL DEFAULT '',
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
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_data_types" (
    "id" TEXT NOT NULL,
    "service_vendor_use_id" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "data_handling_profiles_organization_id_key" ON "data_handling_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_organization_data_types_organization_id" ON "organization_data_types"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_data_types_organization_id_name_key" ON "organization_data_types"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_business_activities_organization_id" ON "business_activities"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_activities_organization_id_name_key" ON "business_activities"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_service_business_activities_service_id" ON "service_business_activities"("service_id");

-- CreateIndex
CREATE INDEX "idx_service_business_activities_business_activity_id" ON "service_business_activities"("business_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_business_activities_service_id_business_activity_id_key" ON "service_business_activities"("service_id", "business_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_profiles_organization_id_key" ON "access_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_organization_providers_organization_id" ON "organization_providers"("organization_id");

-- CreateIndex
CREATE INDEX "idx_organization_providers_service_id" ON "organization_providers"("service_id");

-- CreateIndex
CREATE INDEX "idx_organization_providers_provider_id" ON "organization_providers"("provider_id");

-- CreateIndex
CREATE INDEX "idx_organization_providers_system_type" ON "organization_providers"("system_type");

-- CreateIndex
CREATE UNIQUE INDEX "organization_providers_org_service_system_provider_key" ON "organization_providers"("organization_id", "service_id", "system_type", "provider_id");

-- CreateIndex
CREATE INDEX "idx_vendors_organization_id" ON "vendors"("organization_id");

-- CreateIndex
CREATE INDEX "idx_vendors_provider_id" ON "vendors"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_organization_id_name_key" ON "vendors"("organization_id", "name");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_organization_id" ON "service_vendor_uses"("organization_id");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_service_id" ON "service_vendor_uses"("service_id");

-- CreateIndex
CREATE INDEX "idx_service_vendor_uses_vendor_id" ON "service_vendor_uses"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_vendor_uses_service_id_vendor_id_key" ON "service_vendor_uses"("service_id", "vendor_id");

-- CreateIndex
CREATE INDEX "idx_templates_organization_id" ON "templates"("organization_id");

-- CreateIndex
CREATE INDEX "idx_templates_policy_owner_user_id" ON "templates"("policy_owner_user_id");

-- CreateIndex
CREATE INDEX "idx_templates_policy_approver_user_id" ON "templates"("policy_approver_user_id");

-- CreateIndex
CREATE INDEX "idx_templates_source_system_template_slug" ON "templates"("source_system_template_slug");

-- CreateIndex
CREATE UNIQUE INDEX "templates_organization_id_slug_key" ON "templates"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_documents_organization_id" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "idx_documents_template_id" ON "documents"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_organization_id_template_id_key" ON "documents"("organization_id", "template_id");

-- CreateIndex
CREATE INDEX "idx_vendor_data_types_service_vendor_use_id" ON "vendor_data_types"("service_vendor_use_id");

-- CreateIndex
CREATE INDEX "idx_vendor_data_types_organization_data_type_id" ON "vendor_data_types"("organization_data_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_data_types_use_id_data_type_id_key" ON "vendor_data_types"("service_vendor_use_id", "organization_data_type_id");

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
ALTER TABLE "data_handling_profiles" ADD CONSTRAINT "data_handling_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_data_types" ADD CONSTRAINT "organization_data_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_activities" ADD CONSTRAINT "business_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_business_activities" ADD CONSTRAINT "service_business_activities_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_business_activities" ADD CONSTRAINT "service_business_activities_business_activity_id_fkey" FOREIGN KEY ("business_activity_id") REFERENCES "business_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_profiles" ADD CONSTRAINT "access_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_providers" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_providers" ADD CONSTRAINT "organization_providers_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_vendor_uses" ADD CONSTRAINT "service_vendor_uses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_vendor_uses" ADD CONSTRAINT "service_vendor_uses_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_vendor_uses" ADD CONSTRAINT "service_vendor_uses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_policy_owner_user_id_fkey" FOREIGN KEY ("policy_owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_policy_approver_user_id_fkey" FOREIGN KEY ("policy_approver_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_data_types" ADD CONSTRAINT "vendor_data_types_service_vendor_use_id_fkey" FOREIGN KEY ("service_vendor_use_id") REFERENCES "service_vendor_uses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_data_types" ADD CONSTRAINT "vendor_data_types_organization_data_type_id_fkey" FOREIGN KEY ("organization_data_type_id") REFERENCES "organization_data_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
