/*
  Warnings:

  - Made the column `startTime` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- First, set a default value for existing NULL startTime values (set to current time)
UPDATE "Event" SET "startTime" = NOW() WHERE "startTime" IS NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isFlexible" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "startTime" SET NOT NULL;
