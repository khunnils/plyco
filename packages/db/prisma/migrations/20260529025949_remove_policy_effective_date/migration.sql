/*
  Warnings:

  - You are about to drop the column `policy_effective_date` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "policy_effective_date";
