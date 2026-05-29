/**
 * AES-256-GCM encryption/decryption utilities for sensitive fields.
 * 
 * Usage:
 *   const encrypted = encryptField("09123456789");
 *   const decrypted = decryptField(encrypted);
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    "ENCRYPTION_KEY must be set and exactly 64 hex characters (32 bytes). " +
    "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, "hex");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: iv:ciphertext:authTag (all hex-encoded)
 */
export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:ciphertext:authTag (all hex)
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Input format: iv:ciphertext:authTag (all hex-encoded)
 */
export function decryptField(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    throw new Error("Decryption failed - ciphertext may be corrupted or tampered");
  }
}

/**
 * Batch encrypt multiple fields
 */
export function encryptFields(
  obj: Record<string, string | null | undefined>
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value ? encryptField(value) : null;
  }
  return result;
}

/**
 * Batch decrypt multiple fields
 */
export function decryptFields(
  obj: Record<string, string | null | undefined>
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value ? decryptField(value) : null;
  }
  return result;
}
