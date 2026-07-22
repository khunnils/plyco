ALTER TABLE "security_profiles"
ALTER COLUMN "customer_notification_process" TYPE JSONB
USING CASE
  WHEN "customer_notification_process" IS NULL THEN NULL
  ELSE jsonb_build_array("customer_notification_process")
END;
