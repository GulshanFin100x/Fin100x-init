-- CreateEnum
CREATE TYPE "public"."VideoType" AS ENUM ('VIDEO', 'SHORT');

-- AlterTable
ALTER TABLE "public"."Video" ADD COLUMN     "type" "public"."VideoType" NOT NULL DEFAULT 'VIDEO';
