ALTER TABLE "organization_data_types"
  ADD COLUMN "subject_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "purposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "collection_methods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "legal_basis" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "retention_days" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "shared_with_third_parties" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "third_parties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
