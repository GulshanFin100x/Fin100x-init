/*
  Warnings:

  - You are about to drop the column `calenderId` on the `Advisor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[calendarId]` on the table `Advisor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Advisor_calenderId_key";

-- AlterTable
ALTER TABLE "public"."Advisor" DROP COLUMN "calenderId",
ADD COLUMN     "calendarId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_calendarId_key" ON "public"."Advisor"("calendarId");
