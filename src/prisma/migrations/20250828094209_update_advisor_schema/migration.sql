/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Advisor` table. All the data in the column will be lost.
  - You are about to drop the column `tag1` on the `Advisor` table. All the data in the column will be lost.
  - You are about to drop the column `tag2` on the `Advisor` table. All the data in the column will be lost.
  - You are about to drop the column `tag3` on the `Advisor` table. All the data in the column will be lost.
  - Added the required column `role` to the `Advisor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Advisor" DROP COLUMN "imageUrl",
DROP COLUMN "tag1",
DROP COLUMN "tag2",
DROP COLUMN "tag3",
ADD COLUMN     "expertiseTags" TEXT[],
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "yearsExperience" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "advisorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "public"."Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
