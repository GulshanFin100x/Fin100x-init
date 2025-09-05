import express from "express";
import { getBanners, createBanner } from "../controllers/banner.controller.js";

const router = express.Router();

// Public endpoint to fetch banners
router.get("/", getBanners);

// Protected (only admin can add banners later if you want)
router.post("/", createBanner);

export default router;
