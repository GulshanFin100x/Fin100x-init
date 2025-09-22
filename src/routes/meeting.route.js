import express from "express";
import {
  getNextMeetingLink,
  uploadMeetingTranscript,
  getMeetingTranscript,
} from "../controllers/meeting.controller.js";

const router = express.Router();

router.get("/next", getNextMeetingLink);

export default router;
