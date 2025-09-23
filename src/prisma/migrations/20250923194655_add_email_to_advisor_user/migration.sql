/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Advisor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Advisor" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_email_key" ON "public"."Advisor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
