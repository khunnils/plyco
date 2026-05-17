ALTER TABLE "organizations"
  ADD COLUMN "legal_entity_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "website" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "contact_email" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "security_contact_email" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "privacy_contact_email" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
