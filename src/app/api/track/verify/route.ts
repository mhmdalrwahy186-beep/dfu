import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeOmaniPhone, toLatinDigits } from "@/lib/phone";
import { clientIp, hashIdentifier, hashOtp, rateLimit, safeEqualHex } from "@/lib/security";
import { isServiceConfigured } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_MAX_ATTEMPTS, normalizeReference, setTrackingSession } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ reference: z.string().max(30), phone: z.string().max(20), code: z.string().max(10) });
const INVALID = { ok: false, error: "رمز التحقق غير صحيح أو منتهي الصلاحية." };

export async function POST(request: Request) {
  if (!isServiceConfigured()) return NextResponse.json({ ok: false, error: "الخدمة غير مفعّلة." }, { status: 503 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(INVALID, { status: 422 });

  const ip = hashIdentifier(await clientIp());
  if (!(await rateLimit(`track:verify:ip:${ip}`, 15, 900))) {
    return NextResponse.json({ ok: false, error: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة." }, { status: 429 });
  }

  const reference = normalizeReference(parsed.data.reference);
  const phone = normalizeOmaniPhone(parsed.data.phone);
  const code = toLatinDigits(parsed.data.code).replace(/\D/g, "");
  if (!phone || code.length !== 6) return NextResponse.json(INVALID, { status: 400 });

  const supabase = createAdminClient();
  const { data: d } = await supabase.from("donations").select("id, phone, whatsapp, anonymized_at").eq("reference", reference).maybeSingle();
  if (!d || d.anonymized_at || (d.phone !== phone && d.whatsapp !== phone)) return NextResponse.json(INVALID, { status: 400 });

  const { data: otp } = await supabase
    .from("tracking_otps")
    .select("id, code_hash, attempts, expires_at")
    .eq("donation_id", d.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp || new Date(otp.expires_at) < new Date() || otp.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  if (!safeEqualHex(hashOtp(code, d.id), otp.code_hash)) {
    await supabase.from("tracking_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return NextResponse.json(INVALID, { status: 400 });
  }

  await supabase.from("tracking_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
  await setTrackingSession(d.id);
  return NextResponse.json({ ok: true });
}
