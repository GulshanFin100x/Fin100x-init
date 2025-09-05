/*
  Warnings:

  - You are about to drop the column `role` on the `Advisor` table. All the data in the column will be lost.
  - Added the required column `certificate` to the `Advisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Advisor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Advisor" DROP COLUMN "role",
ADD COLUMN     "certificate" TEXT NOT NULL,
ADD COLUMN     "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT NOT NULL;
