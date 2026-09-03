import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Magic-link tokens. A token is `<random>.<signature>` where the signature is
 * an HMAC over the random part. The full token is also stored in
 * `email_tokens` with an expiry so it can be revoked server-side. Signature
 * verification lets us reject junk before touching the database.
 */

export const TOKEN_TTL_DAYS = 180;

/** Returns null in production when EMAIL_TOKEN_SECRET is missing; a dev fallback otherwise. */
function secret(): string | null {
  const s = process.env.EMAIL_TOKEN_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") return null;
  return "dev-only-insecure-token-secret";
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 27);
}

export function createToken(key: string | null = secret()): { token: string; expiresAt: Date } {
  if (!key) throw new Error("EMAIL_TOKEN_SECRET must be set (16+ chars) in production");
  const random = randomBytes(18).toString("base64url");
  const token = `${random}.${sign(random, key)}`;
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 86_400_000);
  return { token, expiresAt };
}

export function verifyTokenSignature(token: string, key: string | null = secret()): boolean {
  if (!key) return false; // fail closed: nothing verifies without a secret
  const idx = token.indexOf(".");
  if (idx <= 0 || token.length > 128) return false;
  const random = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(random, key);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
