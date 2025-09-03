import jwt from "jsonwebtoken";
import crypto from "crypto";

export const ACCESS_TTL_MINUTES = 15;
export const REFRESH_TTL_DAYS = 7;

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: `${ACCESS_TTL_MINUTES}m`,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: `${REFRESH_TTL_DAYS}d`,
  });
}

export function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
