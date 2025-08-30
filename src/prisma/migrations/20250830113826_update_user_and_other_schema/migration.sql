/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `aadhaarNo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kycDone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `panCardNo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNo` on the `User` table. All the data in the column will be lost.
  - Added the required column `uid` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropIndex
DROP INDEX "public"."User_aadhaarNo_key";

-- DropIndex
DROP INDEX "public"."User_email_key";

-- DropIndex
DROP INDEX "public"."User_panCardNo_key";

-- DropIndex
DROP INDEX "public"."User_phoneNo_key";

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "aadhaarNo",
DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "id",
DROP COLUMN "kycDone",
DROP COLUMN "lastName",
DROP COLUMN "panCardNo",
DROP COLUMN "phoneNo",
ADD COLUMN     "uid" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("uid");

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "message_query" TEXT NOT NULL,
    "message_response" TEXT NOT NULL,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
