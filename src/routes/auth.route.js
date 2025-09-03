import express from "express";
import {
  requestOtp,
  verifyOtp,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);
router.post("/token/refresh", refreshAccessToken);
router.post("/logout", protectRoute, logout);

export default router;
