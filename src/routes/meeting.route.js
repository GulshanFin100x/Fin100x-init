import express from "express";
import {
  getUpcomingMeetingsForUser,
  uploadMeetingTranscript,
  getMeetingTranscript,
} from "../controllers/meeting.controller.js";

const router = express.Router();

router.get("/next", getUpcomingMeetingsForUser);

export default router;
