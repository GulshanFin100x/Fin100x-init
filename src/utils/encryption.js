import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SECRET = process.env.ENCRYPTION_KEY || "super-secret-32bytes-key!!!!";
// Must be exactly 32 characters (32 bytes)

export function encrypt(text) {
  const iv = crypto.randomBytes(16); // random IV
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    tag,
  };
}

export function decrypt({ iv, content, tag }) {
  const decipher = crypto.createDecipheriv(
    ALGO,
    Buffer.from(SECRET),
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
