DELETE FROM "documents";

ALTER TABLE "documents" ADD COLUMN "source_fingerprint" JSONB NOT NULL;
