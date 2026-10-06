-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "public_slug" TEXT;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_public_slug_key" ON "organizations"("public_slug");
