-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastQuizTakenAt" TIMESTAMP(3),
ADD COLUMN     "redeemPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuizzes" INTEGER NOT NULL DEFAULT 0;
