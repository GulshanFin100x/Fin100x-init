import prisma from "../lib/prisma.js";
import { calcFinancialHealthScore } from "../utils/financialScore.js";

// Create a new financial data entry
export const createFinancialData = async (req, res) => {
  try {
    const userId =  req.user?.userId; // Use auth or body parameter

    const inputData = req.body;
    const { score, rating } = calcFinancialHealthScore(inputData);
    const dataToSave = { ...inputData, userId, score};

    const saved = await prisma.financialData.create({ data: dataToSave });
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create financial data error:", error);
    res.status(500).json({ error: "Failed to create financial data" });
  }
};


export const getLatestUserFinancialData = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Fetch the most recent entry for this user
    const latestEntry = await prisma.financialData.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestEntry) {
      return res
        .status(404)
        .json({ error: "No financial data found for this user" });
    }

    res.json(latestEntry);
  } catch (error) {
    console.error("Error fetching latest financial data:", error);
    res.status(500).json({ error: "Failed to fetch latest financial data" });
  }
};

export const getFinScoreSuggestions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const latest = await prisma.financialData.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest)
      return res.status(404).json({ error: "No financial data found" });

    const increments = {
      monthlySavings: 750,
      sipInvestments: 500,
      totalAssets: 5000,
      totalLoans: -5000,
      monthlyEmi: -1000,
      creditCardOutstanding: -1000,
      insuranceCoverage: 10000,
      taxSavings: 1000,
      retirementFund: 5000,
      monthlyIncome: 2000,
      monthlyExpenses: -500,
      savingsRatio: 0.05,
    };

    const suggestions = [];
    for (const field in increments) {
      const modified = { ...latest };
      if (field === "savingsRatio") {
        modified[field] = Math.min(
          1,
          (modified[field] || 0) + increments[field]
        );
      } else {
        modified[field] = Math.max(
          0,
          (modified[field] || 0) + increments[field]
        );
      }
      const { score } = calcFinancialHealthScore(modified);
      const increase = score - (latest.score || 0);
      if (increase > 0) {
        suggestions.push({
          field,
          suggestion:
            field === "savingsRatio"
              ? `Increase savings ratio by 5%`
              : increments[field] > 0
              ? `Increase ${field} by ${increments[field]}`
              : `Decrease ${field} by ${-increments[field]}`,
          estimatedFinScoreIncrease: increase,
        });
      }
    }
    suggestions.sort(
      (a, b) => b.estimatedFinScoreIncrease - a.estimatedFinScoreIncrease
    );

    res.status(200).json({
      success: true,
      message: "FinScore suggestions generated successfully.",
      data: {
        date: new Date().toISOString(),
        currentScore: latest.score,
        suggestions,
      },
    });
  } catch (error) {
    console.error("Error generating FinScore suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate suggestions",
      data: null,
    });
  }
};
