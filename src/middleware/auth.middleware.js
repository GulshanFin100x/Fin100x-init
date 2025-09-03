// src/middleware/auth.middleware.js
import { verifyAccessToken } from "../utils/crypto.js";

export async function protectRoute(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: "NO_AUTH", message: "Missing token" });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res
      .status(401)
      .json({ code: "INVALID_TOKEN", message: "Invalid or expired token" });
  }

  req.user = decoded; // { userId, ... }
  next();
}
