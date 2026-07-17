ALTER TABLE "service_profiles"
  ADD COLUMN "cookie_categories" JSONB;

UPDATE "service_profiles"
SET
  "cookie_consent_mechanism" = NULL,
  "non_essential_cookies_blocked_until_consent" = NULL,
  "cookie_consent_withdrawal_method" = NULL,
  "global_privacy_control_supported" = NULL;

ALTER TABLE "service_profiles"
  DROP COLUMN "cookie_tracking_categories",
  DROP COLUMN "cookie_reject_as_easy_as_accept",
  DROP COLUMN "cookie_consent_no_preticked_boxes",
  DROP COLUMN "do_not_track_response";
