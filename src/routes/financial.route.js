import express from "express";
import {
  createFinancialData,
  getLatestUserFinancialData,
  // getFinScoreSuggestions,
} from "../controllers/financialScore.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createFinancialData);
router.get("/latest", getLatestUserFinancialData);
// router.get("/suggestions", getFinScoreSuggestions);

export default router;
