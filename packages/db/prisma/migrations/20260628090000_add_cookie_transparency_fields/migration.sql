ALTER TABLE "service_profiles"
  ADD COLUMN "non_essential_cookies_blocked_until_consent" BOOLEAN,
  ADD COLUMN "cookie_reject_as_easy_as_accept" BOOLEAN,
  ADD COLUMN "cookie_consent_withdrawal_method" TEXT,
  ADD COLUMN "cookie_consent_no_preticked_boxes" BOOLEAN;
