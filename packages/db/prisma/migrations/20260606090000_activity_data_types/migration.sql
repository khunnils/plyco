CREATE TABLE "business_activity_data_types" (
    "id" TEXT NOT NULL,
    "business_activity_id" TEXT NOT NULL,
    "organization_data_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_activity_data_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_activity_data_types_activity_id_data_type_id_key" ON "business_activity_data_types"("business_activity_id", "organization_data_type_id");

CREATE INDEX "idx_business_activity_data_types_business_activity_id" ON "business_activity_data_types"("business_activity_id");

CREATE INDEX "idx_business_activity_data_types_organization_data_type_id" ON "business_activity_data_types"("organization_data_type_id");

ALTER TABLE "business_activity_data_types" ADD CONSTRAINT "business_activity_data_types_business_activity_id_fkey" FOREIGN KEY ("business_activity_id") REFERENCES "business_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_activity_data_types" ADD CONSTRAINT "business_activity_data_types_organization_data_type_id_fkey" FOREIGN KEY ("organization_data_type_id") REFERENCES "organization_data_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
