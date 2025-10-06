import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js"; // ➕ ADDED: Import prisma to access the DB
const ACCESS_SECRET = process.env.JWT_SECRET || "access_secret";

export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, ACCESS_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });

    // ----------------------------------------------------
    // BLACKLIST CHECK: The core new functionality
    // ----------------------------------------------------
    try {
      const isBlacklisted = await prisma.blacklistedToken.findUnique({
        where: { token },
      });

      if (isBlacklisted) {
        // 401 Unauthorized or 403 Forbidden is acceptable here, 403 usually implies permission/revocation issue
        return res.status(403).json({ error: "Access token has been revoked" });
      }
    } catch (dbError) {
      console.error("Blacklist DB check failed:", dbError);
      // Treat DB failure as a system error
      return res
        .status(500)
        .json({ error: "Authentication failed due to system error" });
    }

    req.admin = decoded; // { adminId, role , name}
    next();
  });
};
