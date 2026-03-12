const crypto = require("crypto");

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (Buffer.from(ENCRYPTION_KEY, "utf8").length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
}
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypt a plaintext string.
 * Returns format: iv:encrypted (both hex encoded)
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt an encrypted string.
 * Expects format: iv:encrypted (both hex encoded)
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Check if a string looks like it's already encrypted (iv:hex format)
 */
function isEncrypted(text) {
  if (!text) return false;
  const parts = text.split(":");
  return parts.length === 2 && /^[0-9a-f]{32}$/.test(parts[0]);
}

module.exports = { encrypt, decrypt, isEncrypted };
