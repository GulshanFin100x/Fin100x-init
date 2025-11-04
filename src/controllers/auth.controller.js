// src/controllers/auth.controller.js
import prisma from "../lib/prisma.js";
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

// Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper to revoke existing session(s) for user (soft revoke)
async function revokeExistingSession(userId) {
  await prisma.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

// 1) Request OTP
export async function requestOtp(req, res) {
  try {
    const { phone, channel, locale, consent, deviceId } = req.body || {};
    // Validate phone number
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

    const requestId = "req_" + Math.random().toString(36).slice(2, 12);
    const otp = generateNumericOTP(6);
    const otpHash = await hashOtp(otp);

    // Prepare SMS Body
    const smsBody = `Your OTP for Fin100x.ai is ${otp}. It is valid for 3 minutes. Do not share it with anyone.`;

    // ---- Send SMS (Twilio) ----
    try {
      await client.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER, // example: "+1XXXXXXXXXX"
        to: phone,
      });
    } catch (smsError) {
      console.error("Twilio SMS Error:", smsError);

      return res.status(500).json({
        code: "SMS_FAILED",
        message: "Failed to send OTP SMS. Try again.",
      });
    }

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
