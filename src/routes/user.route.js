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
  getUserProfile,
  submitQuiz,
  getGlossaryTerms,
  getGlossaryTags,
  listSections,
  getRulesBySection,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/glossary", getGlossaryTerms);
router.get("/glossary/tags", getGlossaryTags);
router.get("/moneyrules/sections", listSections);
router.get("/moneyrules/sections/:id/rules", getRulesBySection);

router.get("/enableAllFeatures", (req, res) => {
  res.json({
    status: true,
  });
});

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


export default router;