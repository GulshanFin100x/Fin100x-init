import express from "express";
import {
  getUpcomingMeetingsForUser,
  uploadMeetingTranscript,
  getMeetingTranscript,
} from "../controllers/meeting.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/next", getUpcomingMeetingsForUser);

export default router;
