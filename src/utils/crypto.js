// src/utils/crypto.js
import crypto from "crypto";
import jwt from "jsonwebtoken";

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// timingSafeBufferCompare: expects two hex strings of equal length
export function timingSafeHexCompare(hexA, hexB) {
  try {
    const a = Buffer.from(hexA, "hex");
    const b = Buffer.from(hexB, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function addDaysFromNow(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt;
}

export function signAccessToken(payload, opts = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  const expiresIn = opts.expiresIn || process.env.ACCESS_TTL || "15m";
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload, opts = {}) {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) throw new Error("REFRESH_SECRET not set");
  const expiresIn = opts.expiresIn || `${process.env.REFRESH_TTL_DAYS || 30}d`;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (e) {
    return null;
  }
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}
