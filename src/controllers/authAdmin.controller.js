import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import crypto from "crypto"; 

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Helper function to create new tokens
const createTokens = (admin) => {
  // 1. Access token (15m)
  
  const accessToken = jwt.sign(
    {
      adminId: admin.id,
      name: admin.name,
      role: admin.role,
      jti: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
  const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 2. Refresh token (7d)
  const refreshToken = jwt.sign({ adminId: admin.id }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
};

// --------------------
// SIGNUP (Admin)   only needed to create the first admin
// --------------------
// export const signupAdmin = async (req, res) => {
//   try {
//     const { email, password, name } = req.body;

//     const existing = await prisma.admin.findUnique({ where: { email } });
//     if (existing)
//       return res.status(400).json({ error: "Email already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const admin = await prisma.admin.create({
//       data: { email, password: hashedPassword, name },
//     });

//     res.status(201).json({
//       message: "Admin registered",
//       admin: { id: admin.id, email: admin.email },
//     });
//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({ error: "Failed to register admin" });
//   }
// };

// --------------------
// LOGIN (Admin)
// --------------------
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const { accessToken, refreshToken, refreshExpiresAt } = createTokens(admin); 

    // Enforce single active refresh token: delete any previous tokens for this admin
    await prisma.refreshToken.deleteMany({
      where: { adminId: admin.id },
    });

    // Save new refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: refreshExpiresAt,
        adminId: admin.id,
      },
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// --------------------
// REFRESH TOKEN 
// --------------------
export const refreshToken = async (req, res) => {
  try {
    const { token: oldRefreshToken } = req.body;
    if (!oldRefreshToken)
      return res.status(401).json({ error: "Refresh token required" });

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });
    if (!storedToken)
      return res.status(403).json({ error: "Invalid refresh token" });

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });
      return res.status(403).json({ error: "Refresh token expired" });
    }

    // ----------------------------------------------------
    // CRITICAL FIX: jwt.verify needs to be awaited/handled for async DB call
    // ----------------------------------------------------
    jwt.verify(oldRefreshToken, REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        await prisma.refreshToken
          .delete({ where: { token: oldRefreshToken } })
          .catch(() => {});
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
      });
      if (!admin) {
        return res.status(403).json({ error: "User not found" });
      }

      // 1. Revoke the old refresh token
      await prisma.refreshToken.delete({ where: { token: oldRefreshToken } }); 

      // 2. Create new tokens
      const {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken, 
        refreshExpiresAt: newRefreshExpiresAt, 
      } = createTokens(admin);

      // 3. Save the new refresh token in DB
      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          expiresAt: newRefreshExpiresAt,
          adminId: admin.id,
        },
      });

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
};

// --------------------
// LOGOUT - Blacklisting of access token and deletion of refresh token
// --------------------
export const logoutAdmin = async (req, res) => {
  try {
    const { refreshToken, accessToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "Refresh token required" });
    if (!accessToken)
      return res.status(400).json({ error: "Access token required" });

    // 1. Blacklist the current ACCESS token
    try {
      const decoded = jwt.decode(accessToken);
      if (decoded && decoded.exp) {
        // Convert UNIX timestamp to Date object for Prisma
        const expiresAt = new Date(decoded.exp * 1000);

        await prisma.blacklistedToken.create({
          data: {
            token: accessToken,
            expiresAt: expiresAt,
          },
        });
      }
    } catch (e) {
      console.warn("Could not decode access token for blacklisting:", e);
      // Continue even if decode fails, main goal is refresh token deletion
    }

    // 2. Delete the REFRESH token (Logout)
    const result = await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Refresh token not found" });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};
