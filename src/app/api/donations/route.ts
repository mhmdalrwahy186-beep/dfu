import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { MAX_PHOTOS, MAX_TOTAL_UPLOAD_BYTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { EXTENSION, validateImage } from "@/lib/images";
import { getSettings } from "@/lib/public-data";
import { clientIp, hashIdentifier, rateLimit, signToken } from "@/lib/security";
import { isServiceConfigured } from "@/lib/server-env";
import { DONATION_BUCKET, createAdminClient } from "@/lib/supabase/admin";
import { donationSchema, toDonationPayload } from "@/lib/validation/donation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Fail = { ok: false; error: string; fieldErrors?: Record<string, string> };
const fail = (status: number, error: string, fieldErrors?: Record<string, string>) =>
  NextResponse.json<Fail>({ ok: false, error, fieldErrors }, { status });

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isServiceConfigured()) {
    return fail(503, "المنصة غير مهيأة بعد لاستقبال الطلبات. يرجى المحاولة لاحقًا.");
  }

  // ---- Anti-abuse: per-IP limits ----
  const ipHash = hashIdentifier(await clientIp());
  const [burstOk, dailyOk] = await Promise.all([
    rateLimit(`donate:ip:10m:${ipHash}`, 5, 600),
    rateLimit(`donate:ip:1d:${ipHash}`, 20, 86400),
  ]);
  if (!burstOk || !dailyOk) {
    return fail(429, "تم إرسال عدد كبير من الطلبات. يرجى المحاولة بعد قليل.");
  }

  // ---- Parse & validate ----
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "تعذّر قراءة الطلب. حاول مرة أخرى.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return fail(400, "بيانات الطلب غير صالحة.");
  }

  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key] && key !== "website") fieldErrors[key] = issue.message;
    }
    return fail(422, "يرجى مراجعة الحقول المظللة وتصحيحها.", fieldErrors);
  }
  const values = parsed.data;

  // Honeypot or impossibly fast submission => automated.
  if (values.website || (values.elapsed_ms ?? 0) < 2500) {
    return fail(400, "تعذّر التحقق من الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.");
  }

  const settings = await getSettings();
  if (!settings.collection.accepting) {
    return fail(409, settings.collection.notice || "استقبال طلبات التبرع متوقف مؤقتًا.");
  }

  const payload = toDonationPayload(values);
  const phoneOk = await rateLimit(`donate:phone:1d:${hashIdentifier(payload.phone)}`, 5, 86400);
  if (!phoneOk) {
    return fail(429, "تم تسجيل عدة طلبات بهذا الرقم اليوم. سيتواصل معك الفريق قريبًا بإذن الله.");
  }

  const supabase = createAdminClient();

  // Duplicate submission (double tap / retry): return the original request.
  const existing = await supabase
    .from("donations")
    .select("reference")
    .eq("idempotency_key", payload.idempotency_key)
    .maybeSingle();
  if (existing.data) {
    return NextResponse.json({ ok: true, reference: existing.data.reference, token: signToken({ ref: existing.data.reference }, 3600) });
  }

  // ---- Photos ----
  const files = form.getAll("photos").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
  if (files.length > MAX_PHOTOS) return fail(422, `يمكن رفع ${MAX_PHOTOS} صور كحد أقصى.`);
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) return fail(413, "الحجم الإجمالي للصور كبير جدًا.");

  const donationId = randomUUID();
  const uploaded: { path: string; mime_type: string; size: number }[] = [];
  const cleanup = async () => {
    if (uploaded.length) await supabase.storage.from(DONATION_BUCKET).remove(uploaded.map((u) => u.path));
  };

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImage(bytes);
    if (!check.ok) {
      await cleanup();
      return fail(422, check.error);
    }
    const path = `${donationId}/${randomUUID()}.${EXTENSION[check.type]}`;
    const { error } = await supabase.storage.from(DONATION_BUCKET).upload(path, bytes, {
      contentType: check.type,
      upsert: false,
      cacheControl: "3600",
    });
    if (error) {
      console.error("photo upload failed", error.message);
      await cleanup();
      return fail(502, "تعذّر رفع الصور. حاول مرة أخرى أو أرسل الطلب بدون صور.");
    }
    uploaded.push({ path, mime_type: check.type, size: bytes.byteLength });
  }

  // ---- Save (single transaction in the database) ----
  const { data, error } = await supabase
    .rpc("create_donation", { p: { ...payload, id: donationId, images: uploaded, ip_hash: ipHash } })
    .single<{ out_id: string; out_reference: string; out_created: boolean }>();

  if (error || !data) {
    console.error("create_donation failed", error?.message);
    await cleanup();
    return fail(500, "تعذّر حفظ طلبك بسبب خطأ تقني. لم يتم تسجيل الطلب، يرجى المحاولة مرة أخرى.");
  }
  if (!data.out_created) await cleanup(); // a concurrent duplicate won the race

  return NextResponse.json({ ok: true, reference: data.out_reference, token: signToken({ ref: data.out_reference }, 3600) });
}
