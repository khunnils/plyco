ALTER TABLE "system_code_sets"
ADD COLUMN "uses_hints" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "system_codes"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "organization_codes"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "description_customized" BOOLEAN NOT NULL DEFAULT false;

UPDATE "organization_codes" AS organization_code
SET "description" = system_code."description"
FROM "system_codes" AS system_code
WHERE organization_code."system_code_id" = system_code."id";
