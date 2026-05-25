ALTER TABLE "privacy_profiles"
  ADD COLUMN "response_timeline_days_status" TEXT,
  ADD COLUMN "uses_cookies_or_tracking_technologies" BOOLEAN,
  ADD COLUMN "cookie_tracking_categories" JSONB;
