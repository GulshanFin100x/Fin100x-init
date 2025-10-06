import express from "express";
import {
  // signupAdmin,
  loginAdmin,
  refreshToken,
  logoutAdmin,
} from "../controllers/authAdmin.controller.js";

const router = express.Router();

// router.post("/signup", signupAdmin);
router.post("/login", loginAdmin);
router.post("/refresh", refreshToken);
router.post("/logout", logoutAdmin);


export default router;
