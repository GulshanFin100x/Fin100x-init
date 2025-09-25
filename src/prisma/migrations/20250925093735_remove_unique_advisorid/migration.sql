/*
  Warnings:

  - Made the column `email` on table `Advisor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Advisor_calendarId_key";

-- AlterTable
ALTER TABLE "public"."Advisor" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "calendarId" SET DEFAULT 'primary';
