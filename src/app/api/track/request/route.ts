import { NextResponse } from "next/server";
import { z } from "zod";
import { localDigits, normalizeOmaniPhone } from "@/lib/phone";
import { clientIp, generateOtp, hashIdentifier, hashOtp, rateLimit } from "@/lib/security";
import { isServiceConfigured, smsProvider } from "@/lib/server-env";
import { sendSms } from "@/lib/sms";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_TTL_SECONDS, isReferenceFormat, normalizeReference } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ reference: z.string().min(4).max(30), phone: z.string().min(8).max(20) });

/** Same answer whether or not the donation exists, so references can't be probed. */
const GENERIC = {
  ok: true,
  message: "إذا كانت البيانات مطابقة لطلب مسجّل، فستصلك رسالة نصية تحتوي على رمز التحقق خلال لحظات.",
};

export async function POST(request: Request) {
  if (!isServiceConfigured() || !smsProvider()) {
    return NextResponse.json(
      { ok: false, error: "خدمة التحقق برسالة نصية غير مفعّلة حاليًا. للاستفسار عن حالة تبرعك تواصل مع فريق دفء مباشرة." },
      { status: 503 },
    );
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "يرجى إدخال رقم الطلب ورقم الهاتف." }, { status: 422 });

  const reference = normalizeReference(parsed.data.reference);
  const phone = normalizeOmaniPhone(parsed.data.phone);
  if (!isReferenceFormat(reference)) {
    return NextResponse.json({ ok: false, error: "رقم الطلب غير صحيح. مثال: DF-26-00012" }, { status: 422 });
  }
  if (!phone) return NextResponse.json({ ok: false, error: "رقم الهاتف غير صحيح." }, { status: 422 });

  const ip = hashIdentifier(await clientIp());
  const [ipOk, refOk] = await Promise.all([
    rateLimit(`track:req:ip:${ip}`, 6, 900),
    rateLimit(`track:req:ref:${reference}`, 3, 900),
  ]);
  if (!ipOk || !refOk) {
    return NextResponse.json({ ok: false, error: "طلبات كثيرة خلال وقت قصير. حاول مرة أخرى بعد 15 دقيقة." }, { status: 429 });
  }

  const supabase = createAdminClient();
  const { data: d } = await supabase
    .from("donations")
    .select("id, phone, whatsapp, anonymized_at")
    .eq("reference", reference)
    .maybeSingle();

  const matches = d && !d.anonymized_at && (d.phone === phone || d.whatsapp === phone);
  // SMS can only be delivered to a mobile number (7x / 9x).
  const isMobile = /^[79]/.test(localDigits(phone) ?? "");
  if (!matches || !isMobile) return NextResponse.json(GENERIC);

  const code = generateOtp();
  await supabase.from("tracking_otps").update({ consumed_at: new Date().toISOString() }).eq("donation_id", d.id).is("consumed_at", null);
  const { error } = await supabase.from("tracking_otps").insert({
    donation_id: d.id,
    code_hash: hashOtp(code, d.id),
    expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) {
    console.error("otp insert failed", error.message);
    return NextResponse.json({ ok: false, error: "حدث خطأ تقني. حاول مرة أخرى." }, { status: 500 });
  }

  try {
    await sendSms(phone, `رمز التحقق لمتابعة تبرعك لدى فريق دفء: ${code}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.`);
  } catch (e) {
    console.error("sms send failed", e);
    return NextResponse.json({ ok: false, error: "تعذّر إرسال الرسالة النصية حاليًا. حاول لاحقًا." }, { status: 502 });
  }

  return NextResponse.json(GENERIC);
}
