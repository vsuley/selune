/*
  Warnings:

  - You are about to drop the column `dayPreferences` on the `RecurrencePattern` table. All the data in the column will be lost.
  - You are about to drop the column `timePreferences` on the `RecurrencePattern` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RecurrencePattern" DROP COLUMN "dayPreferences",
DROP COLUMN "timePreferences";
