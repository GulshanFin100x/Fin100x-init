import express from "express";
import { fetchYouTubeVideos } from "../controllers/youtube.controller.js";

const router = express.Router();
router.get("/videos", fetchYouTubeVideos);
export default router;
