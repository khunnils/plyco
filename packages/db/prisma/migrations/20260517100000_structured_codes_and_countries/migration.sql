CREATE TABLE "countries" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "system_code_sets" (
  "id" TEXT NOT NULL,
  "airtable_record_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "system_code_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_codes" (
  "id" TEXT NOT NULL,
  "code_set_id" TEXT NOT NULL,
  "airtable_record_id" TEXT NOT NULL,
  "code_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "system_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_code_sets" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "system_code_set_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_code_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_codes" (
  "id" TEXT NOT NULL,
  "organization_code_set_id" TEXT NOT NULL,
  "system_code_id" TEXT,
  "code_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_code_sets_airtable_record_id_key" ON "system_code_sets"("airtable_record_id");
CREATE UNIQUE INDEX "system_codes_airtable_record_id_key" ON "system_codes"("airtable_record_id");
CREATE UNIQUE INDEX "system_codes_code_set_id_code_id_key" ON "system_codes"("code_set_id", "code_id");
CREATE INDEX "idx_system_codes_code_set_id" ON "system_codes"("code_set_id");
CREATE UNIQUE INDEX "organization_code_sets_organization_id_system_code_set_id_key" ON "organization_code_sets"("organization_id", "system_code_set_id");
CREATE INDEX "idx_organization_code_sets_organization_id" ON "organization_code_sets"("organization_id");
CREATE INDEX "idx_organization_code_sets_system_code_set_id" ON "organization_code_sets"("system_code_set_id");
CREATE UNIQUE INDEX "organization_codes_code_set_id_code_id_key" ON "organization_codes"("organization_code_set_id", "code_id");
CREATE INDEX "idx_organization_codes_organization_code_set_id" ON "organization_codes"("organization_code_set_id");
CREATE INDEX "idx_organization_codes_system_code_id" ON "organization_codes"("system_code_id");

ALTER TABLE "system_codes"
  ADD CONSTRAINT "system_codes_code_set_id_fkey"
  FOREIGN KEY ("code_set_id") REFERENCES "system_code_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_code_sets"
  ADD CONSTRAINT "organization_code_sets_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_code_sets"
  ADD CONSTRAINT "organization_code_sets_system_code_set_id_fkey"
  FOREIGN KEY ("system_code_set_id") REFERENCES "system_code_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "organization_codes"
  ADD CONSTRAINT "organization_codes_organization_code_set_id_fkey"
  FOREIGN KEY ("organization_code_set_id") REFERENCES "organization_code_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "countries" ("code", "name") VALUES
  ('AU', 'Australia'),
  ('CA', 'Canada'),
  ('DE', 'Germany'),
  ('FR', 'France'),
  ('GB', 'United Kingdom'),
  ('IN', 'India'),
  ('NL', 'Netherlands'),
  ('SG', 'Singapore'),
  ('TH', 'Thailand'),
  ('US', 'United States')
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "active" = true,
  "updated_at" = CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION map_controlled_value(value TEXT, field_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT := lower(trim(value));
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN value;
  END IF;

  CASE field_name
    WHEN 'industries' THEN
      CASE normalized
        WHEN 'ai' THEN RETURN 'artificial_intelligence';
        WHEN 'artificial intelligence' THEN RETURN 'artificial_intelligence';
        WHEN 'saas' THEN RETURN 'technology_saas';
        WHEN 'technology / saas' THEN RETURN 'technology_saas';
        WHEN 'healthcare' THEN RETURN 'healthcare';
        WHEN 'financial services' THEN RETURN 'financial_services';
        WHEN 'education' THEN RETURN 'edtech';
        WHEN 'e-commerce' THEN RETURN 'ecommerce';
        WHEN 'ecommerce' THEN RETURN 'ecommerce';
        WHEN 'manufacturing' THEN RETURN 'manufacturing';
        WHEN 'professional services' THEN RETURN 'professional_services';
        ELSE NULL;
      END CASE;
    WHEN 'regions' THEN
      CASE normalized
        WHEN 'us' THEN RETURN 'us';
        WHEN 'united states' THEN RETURN 'us';
        WHEN 'eu' THEN RETURN 'eu';
        WHEN 'european union' THEN RETURN 'eu';
        WHEN 'uk' THEN RETURN 'uk';
        WHEN 'united kingdom' THEN RETURN 'uk';
        WHEN 'apac' THEN RETURN 'apac';
        WHEN 'asia pacific' THEN RETURN 'apac';
        WHEN 'australia' THEN RETURN 'apac';
        WHEN 'latin america' THEN RETURN 'latam';
        WHEN 'middle east & africa' THEN RETURN 'mea';
        WHEN 'global' THEN RETURN 'global';
        ELSE NULL;
      END CASE;
    WHEN 'compliance_goals' THEN
      CASE normalized
        WHEN 'soc 2' THEN RETURN 'soc_2';
        WHEN 'soc_2' THEN RETURN 'soc_2';
        WHEN 'gdpr' THEN RETURN 'gdpr';
        ELSE NULL;
      END CASE;
    WHEN 'subject_types' THEN
      CASE normalized
        WHEN 'admins' THEN RETURN 'administrator';
        WHEN 'admin' THEN RETURN 'administrator';
        WHEN 'administrator' THEN RETURN 'administrator';
        WHEN 'customers' THEN RETURN 'customer';
        WHEN 'customer' THEN RETURN 'customer';
        WHEN 'users' THEN RETURN 'end_user';
        WHEN 'user' THEN RETURN 'end_user';
        WHEN 'end user' THEN RETURN 'end_user';
        WHEN 'employees' THEN RETURN 'employee';
        WHEN 'employee' THEN RETURN 'employee';
        WHEN 'contractors' THEN RETURN 'contractor';
        WHEN 'contractor' THEN RETURN 'contractor';
        WHEN 'students' THEN RETURN 'student';
        WHEN 'student' THEN RETURN 'student';
        WHEN 'website visitors' THEN RETURN 'website_visitor';
        WHEN 'website visitor' THEN RETURN 'website_visitor';
        ELSE NULL;
      END CASE;
    WHEN 'data_purposes' THEN
      CASE normalized
        WHEN 'account management' THEN RETURN 'account_management';
        WHEN 'account notifications' THEN RETURN 'account_management';
        WHEN 'billing' THEN RETURN 'billing_payments';
        WHEN 'billing and payments' THEN RETURN 'billing_payments';
        WHEN 'product improvement' THEN RETURN 'analytics';
        WHEN 'product analytics and improvement' THEN RETURN 'analytics';
        WHEN 'customer support' THEN RETURN 'customer_support';
        WHEN 'legal compliance' THEN RETURN 'legal_compliance';
        WHEN 'marketing' THEN RETURN 'marketing';
        WHEN 'research' THEN RETURN 'research';
        WHEN 'security' THEN RETURN 'security';
        WHEN 'service delivery' THEN RETURN 'service_delivery';
        WHEN 'other' THEN RETURN 'other';
        ELSE NULL;
      END CASE;
    WHEN 'collection_methods' THEN
      CASE normalized
        WHEN 'signup form' THEN RETURN 'account_signup';
        WHEN 'account signup' THEN RETURN 'account_signup';
        WHEN 'application telemetry' THEN RETURN 'product_usage';
        WHEN 'product usage' THEN RETURN 'product_usage';
        WHEN 'manual entry' THEN RETURN 'manual_entry';
        WHEN 'customer upload' THEN RETURN 'customer_upload';
        WHEN 'integrations' THEN RETURN 'integrations';
        WHEN 'support interaction' THEN RETURN 'support_interaction';
        WHEN 'website tracking' THEN RETURN 'website_tracking';
        WHEN 'public sources' THEN RETURN 'public_sources';
        WHEN 'third-party sources' THEN RETURN 'third_party_sources';
        ELSE NULL;
      END CASE;
    WHEN 'legal_basis' THEN
      CASE normalized
        WHEN 'contract' THEN RETURN 'contract';
        WHEN 'consent' THEN RETURN 'consent';
        WHEN 'legal obligation' THEN RETURN 'legal_obligation';
        WHEN 'legitimate interests' THEN RETURN 'legitimate_interests';
        ELSE NULL;
      END CASE;
    WHEN 'dpa_status' THEN
      CASE normalized
        WHEN 'not_required' THEN RETURN 'not_required';
        WHEN 'not required' THEN RETURN 'not_required';
        WHEN 'not_started' THEN RETURN 'not_started';
        WHEN 'not started' THEN RETURN 'not_started';
        WHEN 'requested' THEN RETURN 'requested';
        WHEN 'signed' THEN RETURN 'signed';
        WHEN 'in_review' THEN RETURN 'under_review';
        WHEN 'in review' THEN RETURN 'under_review';
        WHEN 'under_review' THEN RETURN 'under_review';
        WHEN 'under review' THEN RETURN 'under_review';
        WHEN 'unavailable' THEN RETURN 'unavailable';
        WHEN 'unknown' THEN RETURN 'unknown';
        ELSE NULL;
      END CASE;
    WHEN 'vendor_criticality' THEN
      CASE normalized
        WHEN 'low' THEN RETURN 'low';
        WHEN 'medium' THEN RETURN 'medium';
        WHEN 'high' THEN RETURN 'high';
        WHEN 'critical' THEN RETURN 'critical';
        ELSE NULL;
      END CASE;
    WHEN 'data_processing_level' THEN
      CASE normalized
        WHEN 'none' THEN RETURN 'none';
        WHEN 'limited' THEN RETURN 'limited';
        WHEN 'subprocessor' THEN RETURN 'subprocessor';
        ELSE NULL;
      END CASE;
    WHEN 'provider_system_type' THEN
      CASE normalized
        WHEN 'auth' THEN RETURN 'auth';
        WHEN 'source-control' THEN RETURN 'source-control';
        WHEN 'source control' THEN RETURN 'source-control';
        WHEN 'cloud' THEN RETURN 'cloud';
        WHEN 'password-manager' THEN RETURN 'password-manager';
        WHEN 'password manager' THEN RETURN 'password-manager';
        ELSE NULL;
      END CASE;
    WHEN 'vendor_category' THEN
      CASE normalized
        WHEN 'source control' THEN RETURN 'source_control';
        WHEN 'payments' THEN RETURN 'payments';
        WHEN 'project management' THEN RETURN 'project_management';
        WHEN 'identity & access' THEN RETURN 'identity_access';
        WHEN 'observability' THEN RETURN 'observability';
        WHEN 'provider' THEN RETURN 'provider';
        ELSE NULL;
      END CASE;
    ELSE NULL;
  END CASE;

  RAISE EXCEPTION 'Unmapped controlled value "%" for %', value, field_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION map_controlled_array(input_values TEXT[], field_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
  item TEXT;
  mapped TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH item IN ARRAY COALESCE(input_values, ARRAY[]::TEXT[]) LOOP
    mapped := array_append(mapped, map_controlled_value(item, field_name));
  END LOOP;
  RETURN mapped;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION map_country_code(value TEXT, field_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT := lower(trim(value));
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN value;
  END IF;

  CASE normalized
    WHEN 'us' THEN RETURN 'US';
    WHEN 'usa' THEN RETURN 'US';
    WHEN 'united states' THEN RETURN 'US';
    WHEN 'united states of america' THEN RETURN 'US';
    WHEN 'uk' THEN RETURN 'GB';
    WHEN 'gb' THEN RETURN 'GB';
    WHEN 'united kingdom' THEN RETURN 'GB';
    WHEN 'canada' THEN RETURN 'CA';
    WHEN 'ca' THEN RETURN 'CA';
    WHEN 'australia' THEN RETURN 'AU';
    WHEN 'au' THEN RETURN 'AU';
    WHEN 'germany' THEN RETURN 'DE';
    WHEN 'de' THEN RETURN 'DE';
    WHEN 'france' THEN RETURN 'FR';
    WHEN 'fr' THEN RETURN 'FR';
    WHEN 'india' THEN RETURN 'IN';
    WHEN 'in' THEN RETURN 'IN';
    WHEN 'netherlands' THEN RETURN 'NL';
    WHEN 'nl' THEN RETURN 'NL';
    WHEN 'singapore' THEN RETURN 'SG';
    WHEN 'sg' THEN RETURN 'SG';
    WHEN 'thailand' THEN RETURN 'TH';
    WHEN 'th' THEN RETURN 'TH';
    ELSE NULL;
  END CASE;

  RAISE EXCEPTION 'Unmapped country value "%" for %', value, field_name;
END;
$$ LANGUAGE plpgsql;

UPDATE "organizations"
SET
  "country" = map_country_code("country", 'organizations.country'),
  "industries" = map_controlled_array("industries", 'industries'),
  "regions" = map_controlled_array("regions", 'regions'),
  "compliance_goals" = map_controlled_array("compliance_goals", 'compliance_goals');

UPDATE "organization_data_types"
SET
  "subject_types" = map_controlled_array("subject_types", 'subject_types'),
  "purposes" = map_controlled_array("purposes", 'data_purposes'),
  "collection_methods" = map_controlled_array("collection_methods", 'collection_methods'),
  "legal_basis" = map_controlled_array("legal_basis", 'legal_basis');

UPDATE "organization_providers"
SET
  "country_of_registration" = map_country_code("country_of_registration", 'organization_providers.country_of_registration'),
  "category" = map_controlled_value("category", 'vendor_category'),
  "data_processing_level" = map_controlled_value("data_processing_level", 'data_processing_level'),
  "dpa_status" = map_controlled_value("dpa_status", 'dpa_status'),
  "data_regions" = map_controlled_array("data_regions", 'regions'),
  "criticality" = map_controlled_value("criticality", 'vendor_criticality'),
  "system_type" = CASE
    WHEN "system_type" IS NULL THEN NULL
    ELSE map_controlled_value("system_type", 'provider_system_type')
  END;

DROP FUNCTION map_country_code(TEXT, TEXT);
DROP FUNCTION map_controlled_array(TEXT[], TEXT);
DROP FUNCTION map_controlled_value(TEXT, TEXT);
