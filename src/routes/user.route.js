import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getQuiz,
  conversations,
  messages,
  chatWithBot,
  media,
  uploadMedia,
  updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/conversations", conversations);
router.get("/conversations/:id/messages", messages);
router.post("/conversations/chat", chatWithBot);
router.patch("/profile", updateUserProfile);
router.get("/quiz", getQuiz);

// router.post("/media/upload-url", getUploadUrl);
// router.post("/media/confirm", confirmUpload);
// router.get("/media/:userId", getUserMedia);
router.get("/media", media);
router.post("/media/upload", uploadMedia);
// router.post("/KYC/aadhar", onboardUser);
// router.post("/KYC/pan", onboardUser);
// router.post("/KYC/bankDetails", onboardUser);
// router.get("/profile", getUserDeatils);
// router.get("/shorts", getShorts);
// router.get("/videos", getvideos);
// router.get("/news", getnews);


export default router;