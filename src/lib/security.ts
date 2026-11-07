import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { appSecret } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

export { generateOtp, hashOtp, safeEqualHex, signToken, verifyToken } from "@/lib/tokens";

// ---------- Client identity (for rate limiting; stored only as a hash) ----------
export async function clientIp() {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function hashIdentifier(value: string, secret = appSecret()) {
  return createHash("sha256").update(`${secret}:${value}`).digest("hex").slice(0, 32);
}

/**
 * Fixed-window rate limit stored in Postgres (works across serverless instances).
 * Returns true when the request is allowed. Fails open only if the database is unreachable,
 * so a database outage doesn't lock admins out; other protections still apply.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate limit error", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("rate limit failure", e);
    return true;
  }
}
