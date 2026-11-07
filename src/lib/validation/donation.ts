import { z } from "zod";
import { CATEGORIES, CONDITIONS, PERIODS, QUANTITY_OPTIONS } from "@/lib/constants";
import { isInsideOman, isValidLocation } from "@/lib/oman";
import { isOmaniMobile, isOmaniPhone, normalizeOmaniPhone } from "@/lib/phone";

const trimmed = (max: number) => z.string().trim().max(max, `الحد الأقصى ${max} حرفًا`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const coordinate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);

/** Shared by the browser form (react-hook-form) and the server endpoint. */
export const donationSchema = z
  .object({
    donor_name: trimmed(120).min(3, "يرجى إدخال الاسم الكامل"),
    phone: z
      .string()
      .trim()
      .min(1, "يرجى إدخال رقم الهاتف")
      .refine(isOmaniPhone, "رقم الهاتف غير صحيح. أدخل رقمًا عُمانيًا من 8 أرقام يبدأ بـ 9 أو 7 أو 2"),
    whatsapp: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || isOmaniMobile(v), "رقم واتساب غير صحيح. أدخل رقم هاتف نقال عُماني يبدأ بـ 9 أو 7"),
    governorate: z.string().min(1, "يرجى اختيار المحافظة"),
    wilayat: z.string().min(1, "يرجى اختيار الولاية"),
    address: trimmed(500).min(5, "يرجى كتابة وصف واضح للموقع"),
    address_details: optionalText(500),
    latitude: coordinate,
    longitude: coordinate,
    categories: z.array(z.enum(CATEGORIES)).min(1, "اختر فئة واحدة على الأقل").max(CATEGORIES.length),
    quantity_option: z.enum(QUANTITY_OPTIONS, { errorMap: () => ({ message: "يرجى اختيار الكمية" }) }),
    quantity_other: optionalText(100),
    estimated_pieces: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ invalid_type_error: "أدخل رقمًا صحيحًا" })
        .int("أدخل رقمًا صحيحًا")
        .min(1, "أدخل رقمًا أكبر من صفر")
        .max(10000, "الرقم كبير جدًا")
        .optional(),
    ),
    condition: z.enum(CONDITIONS, { errorMap: () => ({ message: "يرجى اختيار حالة الملابس" }) }),
    preferred_period: z.enum(PERIODS, { errorMap: () => ({ message: "يرجى اختيار الفترة المفضلة" }) }),
    preferred_date: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "تاريخ غير صحيح")
      .refine((v) => {
        if (!v) return true;
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Muscat" }));
        today.setHours(0, 0, 0, 0);
        const d = new Date(`${v}T00:00:00`);
        const max = new Date(today);
        max.setDate(max.getDate() + 90);
        return d >= today && d <= max;
      }, "اختر تاريخًا من اليوم وحتى 90 يومًا قادمة"),
    notes: optionalText(1000),
    consent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الخصوصية للمتابعة" }) }),
    idempotency_key: z.string().uuid(),
    /** Honeypot: real visitors never see or fill this field. */
    website: z.string().max(0).optional(),
    /** Milliseconds the form was open before submitting (anti-bot signal). */
    elapsed_ms: z.preprocess((v) => (v === "" || v === undefined ? 0 : Number(v)), z.number().optional()),
  })
  .superRefine((v, ctx) => {
    if (v.governorate && v.wilayat && !isValidLocation(v.governorate, v.wilayat)) {
      ctx.addIssue({ code: "custom", path: ["wilayat"], message: "الولاية لا تتبع المحافظة المختارة" });
    }
    if (v.quantity_option === "other" && !v.quantity_other) {
      ctx.addIssue({ code: "custom", path: ["quantity_other"], message: "يرجى توضيح الكمية" });
    }
    const hasLat = v.latitude !== undefined;
    const hasLng = v.longitude !== undefined;
    if (hasLat !== hasLng || (hasLat && hasLng && !isInsideOman(v.latitude!, v.longitude!))) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "الموقع المحدد على الخريطة خارج سلطنة عُمان" });
    }
  });

export type DonationFormInput = z.input<typeof donationSchema>;
export type DonationFormValues = z.output<typeof donationSchema>;

/** Builds the payload for the `create_donation` database function. */
export function toDonationPayload(v: DonationFormValues) {
  return {
    donor_name: v.donor_name,
    phone: normalizeOmaniPhone(v.phone)!,
    whatsapp: v.whatsapp ? normalizeOmaniPhone(v.whatsapp) : null,
    governorate: v.governorate,
    wilayat: v.wilayat,
    address: v.address,
    address_details: v.address_details ?? null,
    latitude: v.latitude !== undefined ? Number(v.latitude.toFixed(6)) : null,
    longitude: v.longitude !== undefined ? Number(v.longitude.toFixed(6)) : null,
    categories: v.categories,
    quantity_option: v.quantity_option,
    quantity_other: v.quantity_option === "other" ? (v.quantity_other ?? null) : null,
    estimated_pieces: v.estimated_pieces ?? null,
    condition: v.condition,
    preferred_period: v.preferred_period,
    preferred_date: v.preferred_date ?? null,
    notes: v.notes ?? null,
    idempotency_key: v.idempotency_key,
  };
}
