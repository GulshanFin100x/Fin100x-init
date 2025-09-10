import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createQuiz,
  createGlossaryTerm,
} from "../controllers/admin.controller.js";

const router = express.Router();



router.post("/quiz", createQuiz);
router.post("/glossary", createGlossaryTerm);
// router.post("/onboardAdvisor", onboardAdvisor);
// router.post("/setBanner", setBanner);
// router.post("/addShorts", addShorts);
// router.post("/addVideos", addVideos);
// router.post("/addMaketInsights", addMaketInsights);
// router.get("/getMarketInsights", getMarketInsights);     //pagination should be implemented

export default router;