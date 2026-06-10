ALTER TABLE "organization_codes"
ADD COLUMN IF NOT EXISTS "description_customized" BOOLEAN NOT NULL DEFAULT false;
