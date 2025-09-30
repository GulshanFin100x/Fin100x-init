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
