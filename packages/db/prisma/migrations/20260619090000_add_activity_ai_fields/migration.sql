ALTER TABLE "business_activities"
ADD COLUMN "uses_ai" BOOLEAN,
ADD COLUMN "ai_use_cases" TEXT NOT NULL DEFAULT '',
ADD COLUMN "ai_customer_data_used_for_training" BOOLEAN,
ADD COLUMN "ai_customer_data_sent_to_providers" BOOLEAN,
ADD COLUMN "ai_human_review_of_outputs" BOOLEAN,
ADD COLUMN "ai_users_informed_when_used" BOOLEAN;
