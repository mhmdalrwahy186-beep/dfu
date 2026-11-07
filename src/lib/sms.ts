import "server-only";
import { smsProvider } from "@/lib/server-env";

export class SmsNotConfiguredError extends Error {
  constructor() {
    super("SMS provider is not configured");
  }
}

/** Sends an SMS. Throws if no provider is configured — callers must surface that honestly. */
export async function sendSms(to: string, body: string) {
  const provider = smsProvider();
  if (!provider) throw new SmsNotConfiguredError();

  if (provider === "console") {
    // Development only (disabled automatically in production).
    console.info(`[SMS → ${to}] ${body}`);
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio error ${res.status}: ${text.slice(0, 300)}`);
  }
}
