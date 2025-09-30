import { verifyAccessToken } from "../utils/crypto.js";
import prisma from "../lib/prisma.js";

export async function protectRoute(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: "NO_AUTH", message: "Missing token" });
  }

  // Extra check in DB for revoked session

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res
      .status(401)
      .json({ code: "INVALID_TOKEN", message: "Invalid or expired token" });
  }

  const session = await prisma.session.findUnique({
    where: { id: decoded.sessionId },
  });
  if (!session || session.revoked || session.expiresAt < new Date()) {
    return res.status(401).json({ code: "SESSION_REVOKED" });
  }

  req.user = { userId: decoded.userId };
  next();
}
