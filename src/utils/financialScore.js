const WEIGHTS = {
  wealthGrowth: 0.30,
  creditHealth: 0.20,
  futureSecurity: 0.20,
  incomeExpenses: 0.30
};

export function calcFinancialHealthScore(data) {
  const {
    monthlySavings = 0, sipInvestments = 0,
    totalAssets = 1, totalLoans = 1,
    monthlyEmi = 0, creditCardOutstanding = 0,
    insuranceCoverage = 0, taxSavings = 0, retirementFund = 0,
    monthlyIncome = 1, monthlyExpenses = 0, savingsRatio = 0
  } = data;

  const savingsScore = Math.min((monthlySavings + sipInvestments) / monthlyIncome, 1) * 500;
  const assetScore = Math.min(totalAssets / totalLoans, 1) * 500;
  const wealthGrowth = savingsScore + assetScore;

  const emiScore = (1 - Math.min(monthlyEmi / monthlyIncome, 1)) * 500;
  const ccScore = (1 - Math.min(creditCardOutstanding / totalAssets, 1)) * 500;
  const creditHealth = emiScore + ccScore;

  const coverageScore = Math.min(
    (insuranceCoverage + retirementFund + taxSavings) / (monthlyIncome * 36),
    1
  ) * 1000;
  const futureSecurity = coverageScore;

  const incomeExpenses = Math.min(savingsRatio, 1) * 1000;

  const score =
    WEIGHTS.wealthGrowth * wealthGrowth +
    WEIGHTS.creditHealth * creditHealth +
    WEIGHTS.futureSecurity * futureSecurity +
    WEIGHTS.incomeExpenses * incomeExpenses;

  let rating = 'Needs Improvement';
  if (score >= 800) rating = 'Excellent';
  else if (score >= 650) rating = 'Very Good';
  else if (score >= 500) rating = 'Good';

  return { score: Math.round(score), rating };
}

