import crypto from "crypto";

const MASTER_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "foundex-default-integration-secret-salt")
  .digest(); // 32 bytes

export function encryptSecret(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted (base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText || !cipherText.includes(":")) return cipherText;
  try {
    const [ivB64, tagB64, encB64] = cipherText.split(":");
    if (!ivB64 || !tagB64 || !encB64) return cipherText;

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const encrypted = Buffer.from(encB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return cipherText;
  }
}
