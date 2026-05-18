ALTER TABLE "privacy_profiles" ADD COLUMN "sends_marketing_emails" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "privacy_profiles" ADD COLUMN "marketing_opt_out_method" TEXT NOT NULL DEFAULT '';
ALTER TABLE "privacy_profiles" ADD COLUMN "transactional_emails_sent" BOOLEAN NOT NULL DEFAULT false;
