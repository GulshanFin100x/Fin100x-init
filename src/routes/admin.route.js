import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createQuiz,
  createGlossaryTerm,
  createAdvisor,
} from "../controllers/admin.controller.js";

const router = express.Router();



router.post("/quiz", createQuiz);
router.post("/glossary", createGlossaryTerm);
router.post("/advisors", createAdvisor);                       //Admin adds advisor

// router.post("/setBanner", setBanner);
// router.post("/addShorts", addShorts);
// router.post("/addVideos", addVideos);

export default router;