import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getQuiz,
  conversations,
  messages,
  chatWithBot,
  updateUserProfile,
  saveUserAssets,
  getUserAssets,
  createGlossaryTerm,
  getGlossaryTerms,
  getUserProfile,
  submitQuiz,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/conversations", conversations);
router.get("/conversations/:id/messages", messages);
router.post("/conversations/chat", chatWithBot);
router.get("/profile", getUserProfile);
router.patch("/profile", updateUserProfile);
router.get("/quiz", getQuiz);
router.post("/quiz", submitQuiz);
router.post("/assets", saveUserAssets);
router.get("/assets", getUserAssets);
router.post("/glossary", createGlossaryTerm);
router.get("/glossary", getGlossaryTerms);



export default router;