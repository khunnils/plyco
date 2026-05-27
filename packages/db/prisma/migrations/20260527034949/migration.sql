/*
  Warnings:

  - You are about to drop the column `policy_approver_user_id` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `policy_effective_date` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `policy_last_reviewed_date` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `policy_owner_user_id` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `policy_review_cadence` on the `templates` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "templates" DROP CONSTRAINT "templates_policy_approver_user_id_fkey";

-- DropForeignKey
ALTER TABLE "templates" DROP CONSTRAINT "templates_policy_owner_user_id_fkey";

-- DropIndex
DROP INDEX "idx_templates_policy_approver_user_id";

-- DropIndex
DROP INDEX "idx_templates_policy_owner_user_id";

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "policy_approver_user_id",
DROP COLUMN "policy_effective_date",
DROP COLUMN "policy_last_reviewed_date",
DROP COLUMN "policy_owner_user_id",
DROP COLUMN "policy_review_cadence";
