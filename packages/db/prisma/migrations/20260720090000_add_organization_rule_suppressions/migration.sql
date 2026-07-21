CREATE TABLE "organization_rule_suppressions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_rule_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_rule_suppressions_organization_id_rule_id_key"
ON "organization_rule_suppressions"("organization_id", "rule_id");

CREATE INDEX "idx_organization_rule_suppressions_organization_id"
ON "organization_rule_suppressions"("organization_id");

ALTER TABLE "organization_rule_suppressions"
ADD CONSTRAINT "organization_rule_suppressions_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
