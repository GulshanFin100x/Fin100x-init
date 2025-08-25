import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createQuiz
} from "../controllers/admin.controller.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/createQuiz", createQuiz);
// router.post("/onboardAdvisor", onboardAdvisor);
// router.post("/setBanner", setBanner);
// router.post("/addShorts", addShorts);
// router.post("/addVideos", addVideos);
// router.post("/addMaketInsights", addMaketInsights);
// router.get("/getMarketInsights", getMarketInsights);     //pagination should be implemented

export default router;