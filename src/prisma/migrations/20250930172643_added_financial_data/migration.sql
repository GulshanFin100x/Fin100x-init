-- CreateTable
CREATE TABLE "public"."FinancialData" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlySavings" INTEGER NOT NULL DEFAULT 0,
    "sipInvestments" INTEGER NOT NULL DEFAULT 0,
    "totalAssets" INTEGER NOT NULL DEFAULT 0,
    "totalLoans" INTEGER NOT NULL DEFAULT 0,
    "monthlyEmi" INTEGER NOT NULL DEFAULT 0,
    "creditCardOutstanding" INTEGER NOT NULL DEFAULT 0,
    "insuranceCoverage" INTEGER NOT NULL DEFAULT 0,
    "taxSavings" INTEGER NOT NULL DEFAULT 0,
    "retirementFund" INTEGER NOT NULL DEFAULT 0,
    "monthlyIncome" INTEGER NOT NULL DEFAULT 0,
    "monthlyExpenses" INTEGER NOT NULL DEFAULT 0,
    "savingsRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialData_userId_key" ON "public"."FinancialData"("userId");

-- AddForeignKey
ALTER TABLE "public"."FinancialData" ADD CONSTRAINT "FinancialData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
