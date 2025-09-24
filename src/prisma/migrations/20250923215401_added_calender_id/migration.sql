/*
  Warnings:

  - A unique constraint covering the columns `[calenderId]` on the table `Advisor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Advisor" ADD COLUMN     "calenderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_calenderId_key" ON "public"."Advisor"("calenderId");
