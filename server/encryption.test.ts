import { describe, it, expect, beforeAll } from "vitest";
import { encryptField, decryptField, encryptFields, decryptFields } from "./_core/encryption";

describe("Encryption Utilities", () => {
  beforeAll(() => {
    // Verify ENCRYPTION_KEY is set
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY environment variable not set");
    }
  });

  it("should encrypt and decrypt a simple string", () => {
    const plaintext = "09123456789";
    const encrypted = encryptField(plaintext);
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should encrypt and decrypt email", () => {
    const email = "customer@example.com";
    const encrypted = encryptField(email);
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(email);
  });

  it("should encrypt and decrypt address", () => {
    const address = "台北市信義區忠孝東路五段 68 號";
    const encrypted = encryptField(address);
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(address);
  });

  it("should produce different ciphertexts for same plaintext (due to random IV)", () => {
    const plaintext = "test";
    const encrypted1 = encryptField(plaintext);
    const encrypted2 = encryptField(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptField(encrypted1)).toBe(plaintext);
    expect(decryptField(encrypted2)).toBe(plaintext);
  });

  it("should fail to decrypt tampered ciphertext", () => {
    const plaintext = "secret";
    const encrypted = encryptField(plaintext);
    const tampered = encrypted.slice(0, -2) + "XX"; // Tamper with auth tag
    expect(() => decryptField(tampered)).toThrow();
  });

  it("should batch encrypt multiple fields", () => {
    const obj = {
      phone: "09123456789",
      email: "test@example.com",
      address: "台北市",
    };
    const encrypted = encryptFields(obj);
    expect(encrypted.phone).not.toBe(obj.phone);
    expect(encrypted.email).not.toBe(obj.email);
    expect(encrypted.address).not.toBe(obj.address);

    const decrypted = decryptFields(encrypted);
    expect(decrypted.phone).toBe(obj.phone);
    expect(decrypted.email).toBe(obj.email);
    expect(decrypted.address).toBe(obj.address);
  });

  it("should handle null values in batch operations", () => {
    const obj = {
      phone: "09123456789",
      email: null,
      address: undefined,
    };
    const encrypted = encryptFields(obj);
    expect(encrypted.phone).not.toBe(obj.phone);
    expect(encrypted.email).toBeNull();
    expect(encrypted.address).toBeNull(); // undefined becomes null after JSON serialization
  });

  it("should encrypt empty string", () => {
    const plaintext = "";
    const encrypted = encryptField(plaintext);
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should encrypt unicode characters", () => {
    const plaintext = "🔐 安全加密 🔒";
    const encrypted = encryptField(plaintext);
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
