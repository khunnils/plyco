ALTER TABLE "privacy_profiles" ADD COLUMN "uses_cookies" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "privacy_profiles" ADD COLUMN "cookie_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "privacy_profiles" ADD COLUMN "analytics_providers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "privacy_profiles" ADD COLUMN "advertising_providers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "privacy_profiles" ADD COLUMN "cookie_consent_mechanism" TEXT NOT NULL DEFAULT '';
ALTER TABLE "privacy_profiles" ADD COLUMN "do_not_track_response" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "privacy_profiles" ADD COLUMN "global_privacy_control_supported" BOOLEAN NOT NULL DEFAULT false;
