import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getQuiz,
  conversations,
  messages,
  chatWithBot,
} from "../controllers/user.controller.js";

const router = express.Router();

// router.use(protectRoute);

router.get("/conversations", conversations);
router.get("/conversations/:id/messages", messages);
router.get("/conversations/:conversationId?/chat", chatWithBot);
router.get("/quiz", getQuiz);
// router.post("/KYC/aadhar", onboardUser);
// router.post("/KYC/pan", onboardUser);
// router.post("/KYC/bankDetails", onboardUser);
// router.get("/profile", getUserDeatils);
// router.get("/shorts", getShorts);
// router.get("/videos", getvideos);
// router.get("/news", getnews);


export default router;