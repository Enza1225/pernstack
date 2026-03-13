const crypto = require("crypto");

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (Buffer.from(ENCRYPTION_KEY, "utf8").length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
}

// AES-256-GCM — authenticated encryption (prevents padding oracle attacks)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard: 12 bytes
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: gcm:iv:authTag:encrypted (all hex encoded)
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
    { authTagLength: AUTH_TAG_LENGTH },
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return "gcm:" + iv.toString("hex") + ":" + authTag + ":" + encrypted;
}

/**
 * Decrypt an encrypted string.
 * Supports both new GCM format (gcm:iv:authTag:encrypted) and legacy CBC format (iv:encrypted)
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;

  // New GCM format
  if (encryptedText.startsWith("gcm:")) {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) throw new Error("Invalid GCM encrypted format");
    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "utf8"),
      iv,
      { authTagLength: AUTH_TAG_LENGTH },
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Legacy CBC format (iv:encrypted) — backward compatibility
  const parts = encryptedText.split(":");
  if (parts.length !== 2) return encryptedText;
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Check if a string looks like it's already encrypted
 * Supports GCM (gcm:iv:authTag:encrypted) and legacy CBC (iv:encrypted) formats
 */
function isEncrypted(text) {
  if (!text) return false;
  if (text.startsWith("gcm:")) {
    const parts = text.split(":");
    return parts.length === 4 && /^[0-9a-f]{24}$/.test(parts[1]);
  }
  const parts = text.split(":");
  return parts.length === 2 && /^[0-9a-f]{32}$/.test(parts[0]);
}

module.exports = { encrypt, decrypt, isEncrypted };
