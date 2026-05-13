-- Rename organization-owned templates to the canonical templates table.
ALTER TABLE "organization_templates" RENAME TO "templates";

ALTER TABLE "templates" RENAME CONSTRAINT "organization_templates_pkey" TO "templates_pkey";
ALTER TABLE "templates" RENAME CONSTRAINT "organization_templates_organization_id_fkey" TO "templates_organization_id_fkey";

ALTER INDEX "organization_templates_organization_id_slug_key" RENAME TO "templates_organization_id_slug_key";
ALTER INDEX "idx_organization_templates_organization_id" RENAME TO "idx_templates_organization_id";
ALTER INDEX "idx_organization_templates_source_system_template_slug" RENAME TO "idx_templates_source_system_template_slug";

-- Create generated documents.
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rendered_content" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documents_organization_id_template_id_key" ON "documents"("organization_id", "template_id");
CREATE INDEX "idx_documents_organization_id" ON "documents"("organization_id");
CREATE INDEX "idx_documents_template_id" ON "documents"("template_id");

ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
