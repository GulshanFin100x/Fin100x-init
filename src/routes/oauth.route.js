import express from "express";
import { getAuthUrl, getTokenFromCode } from "../utils/googleOAuthHelper.js";

const router = express.Router();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// Step 1: Start OAuth
router.get("/google", (req, res) => {
  const url = getAuthUrl(SCOPES);
  res.redirect(url);
});

// Step 2: Redirect URL to get tokens
// Set this path in your Google Console as an Authorized Redirect URI (e.g. http://localhost:3000/oauth2callback)
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  const tokens = await getTokenFromCode(code);
  // Save tokens.refresh_token to .env or database for backend use
  res.json({ tokens });
});

export default router;
