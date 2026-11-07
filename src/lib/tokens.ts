import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { appSecret } from "@/lib/server-env";

// ---------- Signed tokens (HMAC-SHA256) ----------
const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signToken(payload: Record<string, unknown>, ttlSeconds: number, secret = appSecret()) {
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken<T extends Record<string, unknown>>(token: string | undefined | null, secret = appSecret()): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp: number };
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------- One-time codes ----------
export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string, donationId: string, secret = appSecret()) {
  return createHmac("sha256", secret).update(`otp:${donationId}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
