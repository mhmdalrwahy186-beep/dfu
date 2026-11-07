import "server-only";

/** Server-only secrets. Importing this file from a client component fails the build. */
export function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

export function appSecret() {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error("APP_SECRET must be set to a random string of at least 32 characters");
  return s;
}

export const isServiceConfigured = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.APP_SECRET?.length ?? 0) >= 32);

export type SmsProvider = "twilio" | "console" | null;

export function smsProvider(): SmsProvider {
  const p = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (p === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    return "twilio";
  }
  if (p === "console" && process.env.NODE_ENV !== "production") return "console";
  return null;
}

export const retentionDays = () => Math.max(30, Number(process.env.RETENTION_DAYS) || 365);
