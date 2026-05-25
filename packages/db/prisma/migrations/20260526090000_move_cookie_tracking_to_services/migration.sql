-- Move cookie/tracking answers from organization privacy profiles to service profiles.
ALTER TABLE "service_profiles"
  RENAME COLUMN "uses_cookies" TO "uses_cookies_or_tracking_technologies";

ALTER TABLE "service_profiles"
  RENAME COLUMN "cookie_types" TO "cookie_tracking_categories";

ALTER TABLE "service_profiles"
  ADD COLUMN "cookie_consent_mechanism" TEXT,
  ADD COLUMN "do_not_track_response" BOOLEAN,
  ADD COLUMN "global_privacy_control_supported" BOOLEAN;

UPDATE "service_profiles" AS service
SET
  "uses_cookies_or_tracking_technologies" = COALESCE(
    privacy."uses_cookies_or_tracking_technologies",
    service."uses_cookies_or_tracking_technologies"
  ),
  "cookie_tracking_categories" = COALESCE(
    privacy."cookie_tracking_categories",
    (
      SELECT
        CASE
          WHEN COUNT(*) = 0 THEN service."cookie_tracking_categories"
          ELSE jsonb_agg(
            CASE
              WHEN value = '"personalization"'::jsonb THEN '"preference"'::jsonb
              ELSE value
            END
          )
        END
      FROM jsonb_array_elements(service."cookie_tracking_categories") AS value
    )
  ),
  "cookie_consent_mechanism" = privacy."cookie_consent_mechanism",
  "do_not_track_response" = privacy."do_not_track_response",
  "global_privacy_control_supported" = privacy."global_privacy_control_supported"
FROM "privacy_profiles" AS privacy
WHERE privacy."organization_id" = service."organization_id";

UPDATE "service_profiles" AS service
SET "cookie_tracking_categories" = (
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN service."cookie_tracking_categories"
      ELSE jsonb_agg(
        CASE
          WHEN value = '"personalization"'::jsonb THEN '"preference"'::jsonb
          ELSE value
        END
      )
    END
  FROM jsonb_array_elements(service."cookie_tracking_categories") AS value
)
WHERE service."cookie_tracking_categories" IS NOT NULL;

ALTER TABLE "privacy_profiles"
  DROP COLUMN "uses_cookies_or_tracking_technologies",
  DROP COLUMN "cookie_tracking_categories",
  DROP COLUMN "cookie_consent_mechanism",
  DROP COLUMN "do_not_track_response",
  DROP COLUMN "global_privacy_control_supported";
