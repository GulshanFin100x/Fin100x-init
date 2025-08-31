import admin from "firebase-admin";
import prisma from "../lib/prisma.js";

const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) {
  console.error("FIREBASE_API_KEY not set in .env");
  process.exit(1);
}

// Initialize firebase-admin (service account must be set via GOOGLE_APPLICATION_CREDENTIALS env var
// or supply credentials object here)
if (!admin.apps.length) {
  // Prevent re-initialization if already initialized
  try {
    admin.initializeApp({
      // If GOOGLE_APPLICATION_CREDENTIALS env var points to serviceAccount json, admin will pick it up automatically
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
      }),
    });
  } catch (err) {
    console.error("Failed to initialize firebase-admin:", err);
    process.exit(1);
  }
}

// Middleware: verify Firebase ID token sent in Authorization: Bearer <token>
export const protectRoute = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match)
    return res.status(401).json({ error: "Unauthorized: missing token" });

  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid; // ✅ Extract uid
    req.user = decoded; // contains uid and custom claims

    // Check if user exists in DB
    let user = await prisma.user.findUnique({
      where: { uid },
    });

    // If not found, create new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          uid, // Store uid as firebaseID
        },
      });
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message || err);
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid/expired token" });
  }
};
