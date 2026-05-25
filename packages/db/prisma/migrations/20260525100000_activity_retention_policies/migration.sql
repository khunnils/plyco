ALTER TABLE "business_activities"
  RENAME COLUMN "retention_days_status" TO "retention_policy";

UPDATE "business_activities"
SET "retention_policy" = CASE
  WHEN "retention_policy" = 'defined' THEN 'fixed'
  ELSE "retention_policy"
END;
