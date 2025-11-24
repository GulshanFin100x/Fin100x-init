-- CreateEnum
CREATE TYPE "public"."LoanCategory" AS ENUM ('PERSONAL_LOAN', 'HOME_LOAN', 'AUTO_LOAN', 'BUSINESS_LOAN', 'EDUCATION_LOAN', 'GOLD_LOAN', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuthType" AS ENUM ('OAUTH2', 'API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DISBURSEMENT', 'EMI_PAYMENT', 'PREPAYMENT', 'LATE_FEE', 'PROCESSING_FEE', 'OTHER_CHARGE');

-- CreateTable
CREATE TABLE "public"."LoanProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "public"."LoanCategory" NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "apiBaseUrl" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL DEFAULT 'v1',
    "authType" "public"."AuthType" NOT NULL,
    "authConfig" JSONB NOT NULL,
    "maxLoanAmount" DOUBLE PRECISION,
    "minLoanAmount" DOUBLE PRECISION,
    "minCreditScore" INTEGER,
    "supportedTenures" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "interestRateRange" TEXT,
    "processingFee" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportsInstantApproval" BOOLEAN NOT NULL DEFAULT false,
    "supportsEmi" BOOLEAN NOT NULL DEFAULT true,
    "supportsTopup" BOOLEAN NOT NULL DEFAULT false,
    "requiresKyc" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "webhookEvents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "LoanProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderFieldMapping" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "internalField" TEXT NOT NULL,
    "providerField" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "transformRule" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "validationRule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderFieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoanApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "providerApplicationId" TEXT,
    "loanType" "public"."LoanCategory" NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "tenure" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION,
    "monthlyEmi" DOUBLE PRECISION,
    "processingFee" DOUBLE PRECISION,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "statusMessage" TEXT,
    "subStatus" TEXT,
    "applicantData" JSONB NOT NULL,
    "providerRequestData" JSONB,
    "providerResponseData" JSONB,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "syncAttempts" INTEGER NOT NULL DEFAULT 0,
    "syncErrors" JSONB,
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedToProvider" BOOLEAN NOT NULL DEFAULT false,
    "providerDocumentId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "public"."ApplicationStatus" NOT NULL,
    "toStatus" "public"."ApplicationStatus" NOT NULL,
    "statusMessage" TEXT,
    "changedBy" TEXT,
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoanTransaction" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "transactionType" "public"."TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "providerResponse" JSONB,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "LoanTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderApiLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "applicationId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestHeaders" JSONB,
    "requestBody" JSONB,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderWebhookLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderForm" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "submitButton" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanProvider_name_key" ON "public"."LoanProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProvider_code_key" ON "public"."LoanProvider"("code");

-- CreateIndex
CREATE INDEX "LoanProvider_category_idx" ON "public"."LoanProvider"("category");

-- CreateIndex
CREATE INDEX "LoanProvider_isActive_idx" ON "public"."LoanProvider"("isActive");

-- CreateIndex
CREATE INDEX "LoanProvider_priority_idx" ON "public"."LoanProvider"("priority");

-- CreateIndex
CREATE INDEX "ProviderFieldMapping_providerId_idx" ON "public"."ProviderFieldMapping"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderFieldMapping_providerId_internalField_key" ON "public"."ProviderFieldMapping"("providerId", "internalField");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_applicationNumber_key" ON "public"."LoanApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "LoanApplication_userId_status_idx" ON "public"."LoanApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "LoanApplication_providerId_status_idx" ON "public"."LoanApplication"("providerId", "status");

-- CreateIndex
CREATE INDEX "LoanApplication_applicationNumber_idx" ON "public"."LoanApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "LoanApplication_providerId_idx" ON "public"."LoanApplication"("providerId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_documentType_idx" ON "public"."ApplicationDocument"("applicationId", "documentType");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "public"."ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "public"."ApplicationStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "public"."ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE INDEX "LoanTransaction_applicationId_transactionDate_idx" ON "public"."LoanTransaction"("applicationId", "transactionDate");

-- CreateIndex
CREATE INDEX "LoanTransaction_applicationId_idx" ON "public"."LoanTransaction"("applicationId");

-- CreateIndex
CREATE INDEX "LoanTransaction_status_idx" ON "public"."LoanTransaction"("status");

-- CreateIndex
CREATE INDEX "ProviderApiLog_providerId_createdAt_idx" ON "public"."ProviderApiLog"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderApiLog_applicationId_createdAt_idx" ON "public"."ProviderApiLog"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderApiLog_providerId_idx" ON "public"."ProviderApiLog"("providerId");

-- CreateIndex
CREATE INDEX "ProviderWebhookLog_providerId_createdAt_idx" ON "public"."ProviderWebhookLog"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderWebhookLog_applicationId_idx" ON "public"."ProviderWebhookLog"("applicationId");

-- CreateIndex
CREATE INDEX "ProviderWebhookLog_processed_idx" ON "public"."ProviderWebhookLog"("processed");

-- CreateIndex
CREATE INDEX "ProviderWebhookLog_providerId_idx" ON "public"."ProviderWebhookLog"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderForm_providerId_key" ON "public"."ProviderForm"("providerId");

-- CreateIndex
CREATE INDEX "ProviderForm_providerId_idx" ON "public"."ProviderForm"("providerId");

-- AddForeignKey
ALTER TABLE "public"."ProviderFieldMapping" ADD CONSTRAINT "ProviderFieldMapping_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."LoanProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanApplication" ADD CONSTRAINT "LoanApplication_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."LoanProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanApplication" ADD CONSTRAINT "LoanApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanTransaction" ADD CONSTRAINT "LoanTransaction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderApiLog" ADD CONSTRAINT "ProviderApiLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."LoanProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderApiLog" ADD CONSTRAINT "ProviderApiLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."LoanApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderWebhookLog" ADD CONSTRAINT "ProviderWebhookLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."LoanProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderWebhookLog" ADD CONSTRAINT "ProviderWebhookLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."LoanApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderForm" ADD CONSTRAINT "ProviderForm_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."LoanProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
