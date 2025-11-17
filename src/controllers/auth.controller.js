// src/controllers/auth.controller.js
import prisma from "../lib/prisma.js";
import axios from "axios";
import twilio from "twilio";

import {
  generateNumericOTP,
  hashOtp,
  compareOtp,
  maskPhone,
} from "../utils/otp.js";
import {
  sha256Hex,
  timingSafeHexCompare,
  addDaysFromNow,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/crypto.js";

const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || "30", 10);


// Helper to revoke existing session(s) for user (soft revoke)
async function revokeExistingSession(userId) {
  await prisma.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

// 1) Request OTP
const PINNACLE_URL =
  process.env.PINNACLE_URL ||
  "https://transapi.pinnacle.in/genericapi/JSONGenericReceiver";
const PINNACLE_ACCESS_KEY = process.env.PINNACLE_ACCESS_KEY;
const SMS_HEADER = process.env.SMS_HEADER; // e.g. "FinAI"
const DLT_ENTITY_ID = process.env.DLT_ENTITY_ID;
const DLT_TEMPLATE_ID = process.env.DLT_TEMPLATE_ID;

export async function requestOtp(req, res) {
  try {
    const { phone, channel, locale, consent, deviceId } = req.body || {};

    // Validate phone number: expect +91XXXXXXXXXX
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ code: "INVALID_PHONE", message: "Phone number is invalid" });
    }

    if (!consent?.acceptedTnC || !consent?.acceptedPrivacy) {
      return res
        .status(400)
        .json({ code: "CONSENT_MISSING", message: "Consent missing" });
    }

    // Ensure provider env vars exist
    if (
      !PINNACLE_ACCESS_KEY ||
      !SMS_HEADER ||
      !DLT_ENTITY_ID ||
      !DLT_TEMPLATE_ID
    ) {
      console.error(
        "Missing SMS provider env vars. Required: PINNACLE_ACCESS_KEY, SMS_HEADER, DLT_ENTITY_ID, DLT_TEMPLATE_ID"
      );
      return res
        .status(500)
        .json({ code: "CONFIG_ERROR", message: "SMS provider not configured" });
    }

    const requestId = "req_" + Math.random().toString(36).slice(2, 12);
    const otp = generateNumericOTP(6);
    const otpHash = await hashOtp(otp);

    // Prepare dest: remove +91 prefix and send only the 10 digits
    // Input was validated to be +91XXXXXXXXXX so safe to slice
    const destNumber = phone.startsWith("+91")
      ? phone.slice(3)
      : phone.replace(/\D/g, "");
    if (destNumber.length !== 10) {
      return res
        .status(400)
        .json({
          code: "INVALID_PHONE_FORMAT",
          message: "Phone must be 10 digits after +91",
        });
    }

    // Build provider body
    const smsBody = `The OTP for Fin100x.ai is ${otp}`; // or format according to DLT template
    const providerPayload = {
      version: "1.0",
      accesskey: PINNACLE_ACCESS_KEY,
      messages: [
        {
          dest: [destNumber],
          msg: smsBody,
          type: "PM", // keep as required by provider
          header: SMS_HEADER,
          app_country: "1",
          country_cd: "91",
          dlt_entity_id: DLT_ENTITY_ID,
          dlt_template_id: DLT_TEMPLATE_ID,
        },
      ],
    };

    // Call Pinnacle API
    let providerResponse;
    try {
      providerResponse = await axios.post(PINNACLE_URL, providerPayload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10_000, // 10s timeout - adjust if needed
      });
    } catch (err) {
      console.error(
        "SMS provider call failed:",
        err?.response?.data ?? err.message
      );
      return res.status(502).json({
        code: "SMS_PROVIDER_ERROR",
        message: "Failed to send OTP via SMS provider",
        details: err?.response?.data ?? err.message,
      });
    }

    // Basic success check: treat HTTP 2xx as success; optionally inspect providerResponse.data
    if (!(providerResponse?.status >= 200 && providerResponse.status < 300)) {
      console.error("SMS provider returned non-2xx:", providerResponse?.data);
      return res.status(502).json({
        code: "SMS_PROVIDER_REJECTED",
        message: "SMS provider rejected the request",
        details: providerResponse?.data,
      });
    }

    // Optionally: inspect providerResponse.data to ensure provider accepted the message.
    // e.g., if provider returns { status: 'SUCCESS' } style responses, check it here.
    // For now we proceed if we got a 2xx response.

    // Only save OTP in DB if SMS sending was successful
    await prisma.OTPRequest.create({
      data: {
        id: requestId,
        phone,
        otpHash,
        deviceId: deviceId || null,
        channel: channel || "sms",
        locale: locale || "en-IN",
        expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
      },
    });

    return res.json({
      requestId,
      expiresIn: 180,
      resendAfter: 30,
      maskedPhone: maskPhone(phone),
      deliveryChannel: channel || "sms",
      providerResponse: {
        // include minimal provider info for debugging (safe to return)
        status: providerResponse.status,
        data: providerResponse.data,
      },
    });
  } catch (e) {
    console.error("requestOtp:", e);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to request OTP" });
  }
}

// 2) Verify OTP (strict single-session)
export async function verifyOtp(req, res) {
  try {
    const { phone, otp, requestId, deviceId } = req.body || {};
    if (!phone || !otp || !requestId) {
      return res
        .status(400)
        .json({
          code: "BAD_REQUEST",
          message: "phone, otp, requestId required",
        });
    }

    const record = await prisma.OTPRequest.findUnique({
      where: { id: requestId },
    });
    if (
      !record ||
      record.phone !== phone ||
      record.expiresAt < new Date() ||
      record.verified
    ) {
      return res
        .status(401)
        .json({ code: "OTP_INVALID", message: "OTP incorrect or expired" });
    }

    const ok = await compareOtp(otp, record.otpHash);
    if (!ok) {
      return res
        .status(401)
        .json({ code: "OTP_INVALID", message: "OTP incorrect or expired" });
    }

    // Mark OTP request verified (idempotency)
    await prisma.OTPRequest.update({
      where: { id: requestId },
      data: { verified: true },
    });

    // Upsert user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          phoneMasked: maskPhone(phone),
          language: "en-IN",
          isNew: true,
          kycStatus: "none",
        },
      });
    } else if (user.isNew) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isNew: false },
      });
    }

    // Revoke previous session(s) to enforce single active session
    await revokeExistingSession(user.id);

    // Issue tokens
    
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store only hash of refresh token
    const refreshHash = sha256Hex(refreshToken);
    const sessionExpiry = addDaysFromNow(REFRESH_TTL_DAYS);

    // Upsert session (unique userId ensures single active session)
    await prisma.session.deleteMany({ where: { userId: user.id } });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        deviceId: deviceId || null,
        revoked: false,
        expiresAt: sessionExpiry,
      },
    });

    // console.log("Session upserted:", session.id, user.id);

    const accessToken = signAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    return res.json({
      user,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: Number(process.env.ACCESS_EXPIRES_SECONDS || 3600),
      },
    });
  } catch (e) {
    console.error("verifyOtp:", e);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to verify OTP" });
  }
}

// 3) Refresh token (validate, compare hash, rotate)
export async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res
        .status(401)
        .json({ code: "INVALID_REFRESH", message: "Missing refresh token" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      return res
        .status(401)
        .json({
          code: "INVALID_REFRESH",
          message: "Invalid or expired refresh token",
        });
    }

    // Fetch session for user
    const session = await prisma.session.findUnique({
      where: { userId: decoded.userId },
    });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          code: "INVALID_REFRESH",
          message: "Refresh session revoked or expired",
        });
    }

    // Compare hashes using timing-safe compare
    const presentedHash = sha256Hex(refreshToken);
    const ok = timingSafeHexCompare(session.refreshTokenHash, presentedHash);
    if (!ok) {
      // This implies the user logged in elsewhere or token replay
      return res
        .status(401)
        .json({
          code: "INVALID_REFRESH",
          message: "Superseded by a newer login",
        });
    }

    // Rotate refresh token
    const newRefreshToken = signRefreshToken({ userId: decoded.userId });
    const newHash = sha256Hex(newRefreshToken);
    const newExpiry = addDaysFromNow(REFRESH_TTL_DAYS);

    await prisma.session.update({
      where: { userId: decoded.userId },
      data: { refreshTokenHash: newHash, expiresAt: newExpiry, revoked: false },
    });

    const accessToken = signAccessToken({
      userId: decoded.userId,
      sessionId: session.id,
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      expiresIn: Number(process.env.ACCESS_EXPIRES_SECONDS || 3600),
    });
  } catch (e) {
    console.error("refreshAccessToken:", e);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to refresh token" });
  }
}

// 4) Logout - revoke session
export async function logout(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Missing user" });

    await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    return res.status(204).send();
  } catch (e) {
    console.error("logout:", e);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to logout" });
  }
}
