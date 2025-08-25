-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "panCardNo" TEXT NOT NULL,
    "aadhaarNo" TEXT NOT NULL,
    "kycDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Advisor" (
    "id" TEXT NOT NULL,
    "salutation" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tag1" TEXT,
    "tag2" TEXT,
    "tag3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNo_key" ON "public"."User"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_panCardNo_key" ON "public"."User"("panCardNo");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadhaarNo_key" ON "public"."User"("aadhaarNo");
