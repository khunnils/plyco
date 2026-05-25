/*
  Warnings:

  - You are about to drop the column `privileged_access_restricted` on the `access_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "access_profiles" DROP COLUMN "privileged_access_restricted";
