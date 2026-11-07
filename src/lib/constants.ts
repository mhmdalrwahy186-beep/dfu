export const DONATION_STATUSES = [
  "new",
  "reviewed",
  "contacting",
  "scheduled",
  "awaiting_pickup",
  "received",
  "completed",
  "cancelled",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const STATUS_META: Record<DonationStatus, { label: string; donorLabel: string; badge: string; dot: string; chart: string }> = {
  new: { label: "جديد", donorLabel: "تم استلام طلبك", badge: "bg-rose-200 text-rose-600 ring-rose-300", dot: "bg-rose-500", chart: "#C18875" },
  reviewed: { label: "تمت المراجعة", donorLabel: "تمت مراجعة طلبك", badge: "bg-sand-300 text-brown-700 ring-sand-400", dot: "bg-caramel-500", chart: "#BC987E" },
  contacting: { label: "جاري التواصل", donorLabel: "جاري التواصل معك", badge: "bg-[#e3e9ef] text-[#45627c] ring-[#c6d3df]", dot: "bg-[#5b7c99]", chart: "#5B7C99" },
  scheduled: { label: "تم تحديد موعد الاستلام", donorLabel: "تم تحديد موعد الاستلام", badge: "bg-[#ebe4f1] text-[#634d7d] ring-[#d5c8e3]", dot: "bg-[#8a72a6]", chart: "#8A72A6" },
  awaiting_pickup: { label: "في انتظار الاستلام", donorLabel: "في انتظار الاستلام", badge: "bg-[#f6ead2] text-[#8a5f17] ring-[#ead3a6]", dot: "bg-[#b7832f]", chart: "#B7832F" },
  received: { label: "تم الاستلام", donorLabel: "تم استلام تبرعك", badge: "bg-[#e1ede5] text-[#3f6b4e] ring-[#c3dccb]", dot: "bg-[#5f8a6e]", chart: "#5F8A6E" },
  completed: { label: "مكتمل", donorLabel: "وصل تبرعك إلى مستحقيه", badge: "bg-[#dbe9d8] text-[#365f33] ring-[#bcd6b7]", dot: "bg-[#4f7a4f]", chart: "#4F7A4F" },
  cancelled: { label: "ملغي", donorLabel: "تم إلغاء الطلب", badge: "bg-[#ece8e4] text-[#6b625a] ring-[#d8d1ca]", dot: "bg-[#8c8279]", chart: "#8C8279" },
};

/** The donor-facing progress timeline (cancelled is shown separately). */
export const DONOR_TIMELINE: DonationStatus[] = ["new", "reviewed", "contacting", "scheduled", "awaiting_pickup", "received", "completed"];

/** Status moves a coordinator (volunteer) may perform on donations assigned to them. */
export const COORDINATOR_TRANSITIONS: Partial<Record<DonationStatus, DonationStatus[]>> = {
  scheduled: ["awaiting_pickup", "received"],
  awaiting_pickup: ["received"],
};

export const CATEGORIES = ["men", "women", "children", "mixed"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  men: "ملابس رجالية",
  women: "ملابس نسائية",
  children: "ملابس أطفال",
  mixed: "ملابس متنوعة",
};

export const QUANTITY_OPTIONS = ["one_bag", "two_bags", "three_bags", "four_five_bags", "more_than_five", "other"] as const;
export type QuantityOption = (typeof QUANTITY_OPTIONS)[number];
export const QUANTITY_LABELS: Record<QuantityOption, string> = {
  one_bag: "كيس واحد",
  two_bags: "كيسان",
  three_bags: "3 أكياس",
  four_five_bags: "4–5 أكياس",
  more_than_five: "أكثر من 5 أكياس",
  other: "كمية أخرى",
};

export const CONDITIONS = ["excellent", "good", "needs_sorting"] as const;
export type Condition = (typeof CONDITIONS)[number];
export const CONDITION_LABELS: Record<Condition, string> = {
  excellent: "بحالة ممتازة",
  good: "بحالة جيدة",
  needs_sorting: "تحتاج إلى فرز",
};

export const PERIODS = ["morning", "evening", "any"] as const;
export type Period = (typeof PERIODS)[number];
export const PERIOD_LABELS: Record<Period, string> = {
  morning: "الفترة الصباحية",
  evening: "الفترة المسائية",
  any: "أي وقت مناسب",
};

export const ROLES = ["super_admin", "admin", "coordinator"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "مشرف عام",
  admin: "مشرف",
  coordinator: "منسق متطوعين",
};

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
/** Total upload per request (serverless platforms such as Vercel cap request bodies at ~4.5 MB). */
export const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Maps database error codes (raised by SQL functions) to Arabic messages. */
export const DB_ERROR_MESSAGES: Record<string, string> = {
  forbidden: "ليست لديك صلاحية لتنفيذ هذا الإجراء.",
  not_found: "لم يتم العثور على السجل المطلوب.",
  same_status: "الطلب في هذه الحالة بالفعل.",
  invalid_transition: "لا يمكن الانتقال إلى هذه الحالة من الحالة الحالية.",
  received_bags_required: "يرجى إدخال عدد الأكياس المستلمة قبل تأكيد الاستلام.",
  note_too_long: "الملاحظة أطول من المسموح.",
  note_required: "يرجى كتابة الملاحظة.",
  date_in_past: "لا يمكن تحديد موعد في الماضي.",
  volunteer_not_found: "المتطوع غير موجود أو غير نشط.",
  cannot_change_self: "لا يمكنك تعديل صلاحيات حسابك بنفسك.",
  not_closed: "يمكن حذف البيانات الشخصية للطلبات المكتملة أو الملغاة فقط.",
  anonymized: "تم حذف البيانات الشخصية لهذا الطلب.",
  "23P01": "يوجد موعد آخر للمتطوع نفسه في هذا الوقت. اختر وقتًا أو متطوعًا آخر.",
};

export function dbErrorMessage(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  if (error.code && DB_ERROR_MESSAGES[error.code]) return DB_ERROR_MESSAGES[error.code];
  if (error.message && DB_ERROR_MESSAGES[error.message]) return DB_ERROR_MESSAGES[error.message];
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
