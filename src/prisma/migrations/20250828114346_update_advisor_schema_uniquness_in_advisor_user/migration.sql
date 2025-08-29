/*
  Warnings:

  - A unique constraint covering the columns `[advisorId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_advisorId_userId_key" ON "public"."Review"("advisorId", "userId");
