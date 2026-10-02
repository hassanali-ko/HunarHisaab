import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Envelope encryption for the API keys people bring with them.
 *
 * A provider key is a bearer credential that can run up someone's bill, so it
 * never sits in the database in the clear and never travels back to the
 * browser. Only a masked hint is ever returned to the client.
 *
 * APP_ENCRYPTION_KEY must be 32 bytes, base64 encoded. Generate one with:
 *   openssl rand -base64 32
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cached: Buffer | null = null;

function masterKey(): Buffer {
  if (cached) return cached;
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32`.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY must decode to exactly 32 bytes, got ${key.length}.`,
    );
  }
  cached = key;
  return key;
}

export function encryptionAvailable(): boolean {
  try {
    masterKey();
    return true;
  } catch {
    return false;
  }
}

/** Returns base64 of iv | authTag | ciphertext. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  if (buf.length <= IV_BYTES + TAG_BYTES) {
    throw new Error("Stored secret is malformed.");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const data = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGO, masterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** What the settings screen shows instead of the key itself. */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/** Constant time compare, for anything token shaped. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
