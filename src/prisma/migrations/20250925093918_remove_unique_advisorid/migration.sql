/*
  Warnings:

  - Made the column `calendarId` on table `Advisor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Advisor" ALTER COLUMN "calendarId" SET NOT NULL;
