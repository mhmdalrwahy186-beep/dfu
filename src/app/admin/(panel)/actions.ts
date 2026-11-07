"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_ROLES, authorize } from "@/lib/auth";
import { DONATION_STATUSES, ROLES, dbErrorMessage } from "@/lib/constants";
import { SITE_URL } from "@/lib/env";
import { normalizeOmaniPhone } from "@/lib/phone";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";
import { DONATION_BUCKET, createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { omanLocalToIso } from "@/lib/utils";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DENIED: ActionResult = { ok: false, error: "ليست لديك صلاحية لتنفيذ هذا الإجراء." };
const ok = (message?: string): ActionResult => ({ ok: true, message });
const uuid = z.string().uuid();

function revalidateDonation(id: string) {
  revalidatePath(`/admin/donations/${id}`);
  revalidatePath("/admin/donations");
  revalidatePath("/admin");
}

// ---------------- Donations ----------------

const statusSchema = z.object({
  donationId: uuid,
  status: z.enum(DONATION_STATUSES),
  note: z.string().trim().max(1000).optional(),
  receivedBags: z.coerce.number().int().min(0).max(1000).optional(),
  receivedPieces: z.coerce.number().int().min(0).max(100000).optional(),
});

export async function changeStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  if (!(await authorize())) return DENIED; // coordinators allowed; the database enforces their limits
  const p = statusSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_donation_status", {
    p_donation: p.data.donationId,
    p_status: p.data.status,
    p_note: p.data.note || null,
    p_received_bags: p.data.receivedBags ?? null,
    p_received_pieces: p.data.receivedPieces ?? null,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(p.data.donationId);
  return ok("تم تحديث الحالة.");
}

export async function assignVolunteer(donationId: string, volunteerId: string | null): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  if (!uuid.safeParse(donationId).success || (volunteerId && !uuid.safeParse(volunteerId).success)) return { ok: false, error: "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_volunteer", { p_donation: donationId, p_volunteer: volunteerId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(donationId);
  revalidatePath("/admin/volunteers");
  return ok(volunteerId ? "تم إسناد الطلب." : "تم إلغاء الإسناد.");
}

const scheduleSchema = z.object({
  donationId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "اختر التاريخ"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "اختر الوقت"),
  duration: z.coerce.number().int().min(15).max(480).default(60),
  volunteerId: uuid.optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(1000).optional(),
});

export async function scheduleCollection(input: z.input<typeof scheduleSchema>): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  const p = scheduleSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_collection", {
    p_donation: p.data.donationId,
    p_scheduled_at: omanLocalToIso(p.data.date, p.data.time),
    p_duration_minutes: p.data.duration,
    p_volunteer: p.data.volunteerId ?? null,
    p_notes: p.data.notes || null,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(p.data.donationId);
  revalidatePath("/admin/calendar");
  return ok("تم حفظ موعد الاستلام.");
}

export async function cancelCollection(appointmentId: string, donationId: string, reason: string): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  if (!uuid.safeParse(appointmentId).success) return { ok: false, error: "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_collection", { p_appointment: appointmentId, p_reason: reason.trim().slice(0, 500) || null });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(donationId);
  revalidatePath("/admin/calendar");
  return ok("تم إلغاء الموعد.");
}

export async function updateCollectionNotes(appointmentId: string, donationId: string, notes: string): Promise<ActionResult> {
  if (!(await authorize())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_collection_notes", { p_appointment: appointmentId, p_notes: notes.slice(0, 1000) });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(donationId);
  return ok("تم حفظ ملاحظات الاستلام.");
}

export async function addNote(donationId: string, body: string): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_donation_note", { p_donation: donationId, p_body: body.slice(0, 2000) });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateDonation(donationId);
  return ok("تمت إضافة الملاحظة.");
}

/** Data retention: removes personal data and photos of a closed donation (Super Admin). */
export async function anonymizeDonation(donationId: string): Promise<ActionResult> {
  if (!(await authorize(["super_admin"]))) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("anonymize_donation", { p_donation: donationId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const paths = (data as string[] | null) ?? [];
  if (paths.length) await createAdminClient().storage.from(DONATION_BUCKET).remove(paths);
  revalidateDonation(donationId);
  return ok("تم حذف البيانات الشخصية للطلب.");
}

// ---------------- Notifications ----------------

export async function markNotificationsRead(ids: string[] | null): Promise<ActionResult> {
  if (!(await authorize())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
  return ok();
}

// ---------------- Quotes ----------------

const quoteText = z.string().trim().min(3, "النص قصير جدًا").max(300, "النص طويل جدًا");

export async function createQuote(text: string): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  const p = quoteText.safeParse(text);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data: last } = await supabase.from("motivational_quotes").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("motivational_quotes").insert({ text: p.data, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return { ok: false, error: error.code === "23505" ? "هذه العبارة موجودة مسبقًا." : dbErrorMessage(error) };
  revalidatePath("/admin/quotes");
  revalidatePath("/", "layout");
  return ok("تمت إضافة العبارة.");
}

export async function updateQuote(id: string, patch: { text?: string; is_active?: boolean }): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  const update: { text?: string; is_active?: boolean } = {};
  if (patch.text !== undefined) {
    const p = quoteText.safeParse(patch.text);
    if (!p.success) return { ok: false, error: p.error.issues[0].message };
    update.text = p.data;
  }
  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);
  const supabase = await createClient();
  const { error } = await supabase.from("motivational_quotes").update(update).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "هذه العبارة موجودة مسبقًا." : dbErrorMessage(error) };
  revalidatePath("/admin/quotes");
  revalidatePath("/", "layout");
  return ok("تم الحفظ.");
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  if (!(await authorize(ADMIN_ROLES))) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("motivational_quotes").delete().eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/admin/quotes");
  revalidatePath("/", "layout");
  return ok("تم حذف العبارة.");
}

// ---------------- Settings ----------------

const httpsUrl = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "يجب أن يبدأ الرابط بـ https://");
const optionalPhone = z.string().trim().max(20).refine((v) => v === "" || normalizeOmaniPhone(v) !== null, "رقم عُماني غير صحيح");

const SETTINGS_SCHEMAS = {
  team: z.object({ name: z.string().trim().min(2).max(80), tagline: z.string().trim().max(120), about: z.string().trim().max(1500), mission: z.string().trim().max(1500) }),
  contact: z.object({
    phone: optionalPhone,
    whatsapp: optionalPhone,
    email: z.string().trim().max(120).refine((v) => v === "" || z.string().email().safeParse(v).success, "بريد إلكتروني غير صحيح"),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(200),
  }),
  social: z.object({ instagram: httpsUrl, x: httpsUrl, tiktok: httpsUrl, snapchat: httpsUrl, facebook: httpsUrl, youtube: httpsUrl }),
  home: z.object({ hero_title: z.string().trim().min(2).max(120), hero_subtitle: z.string().trim().max(400), about_text: z.string().trim().max(1500) }),
  collection: z.object({ accepting: z.boolean(), notice: z.string().trim().max(300) }),
  privacy: z.object({ content: z.string().trim().min(50).max(20000), updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
} satisfies { [K in keyof SiteSettings]: z.ZodType<SiteSettings[K]> };

export async function saveSettings<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): Promise<ActionResult> {
  const staff = await authorize(["super_admin"]);
  if (!staff) return DENIED;
  if (!(key in DEFAULT_SETTINGS)) return { ok: false, error: "إعداد غير معروف." };
  const p = SETTINGS_SCHEMAS[key].safeParse(value);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: p.data, is_public: true, updated_by: staff.id }, { onConflict: "key" });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  await createAdminClient().from("audit_logs").insert({ actor_id: staff.id, action: "settings.updated", entity: "settings", entity_id: key });
  revalidatePath("/", "layout");
  return ok("تم حفظ الإعدادات.");
}

// ---------------- Staff (Super Admin) ----------------

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صحيح"),
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  phone: z.string().trim().optional().refine((v) => !v || normalizeOmaniPhone(v) !== null, "رقم عُماني غير صحيح"),
  role: z.enum(ROLES),
});

export async function inviteStaff(input: z.input<typeof inviteSchema>): Promise<ActionResult> {
  const staff = await authorize(["super_admin"]);
  if (!staff) return DENIED;
  const p = inviteSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(p.data.email, {
    redirectTo: `${SITE_URL}/admin/reset-password?welcome=1`,
    data: { full_name: p.data.full_name },
  });
  if (error || !data.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? "");
    return { ok: false, error: exists ? "يوجد حساب بهذا البريد مسبقًا." : "تعذّر إرسال الدعوة. تحقق من إعدادات البريد في Supabase." };
  }
  const { error: pErr } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: p.data.full_name,
    email: p.data.email,
    phone: p.data.phone ? normalizeOmaniPhone(p.data.phone) : null,
    role: p.data.role,
    is_active: true,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "تعذّر إنشاء الملف الشخصي للعضو." };
  }
  await admin.from("audit_logs").insert({
    actor_id: staff.id,
    action: "staff.invited",
    entity: "profile",
    entity_id: data.user.id,
    details: { role: p.data.role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/volunteers");
  return ok("تم إرسال الدعوة إلى البريد الإلكتروني.");
}

export async function setStaffRole(userId: string, role: string): Promise<ActionResult> {
  if (!(await authorize(["super_admin"]))) return DENIED;
  if (!uuid.safeParse(userId).success || !(ROLES as readonly string[]).includes(role)) return { ok: false, error: "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_role", { p_user: userId, p_role: role });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/admin/users");
  revalidatePath("/admin/volunteers");
  return ok("تم تحديث الصلاحية.");
}

export async function setStaffActive(userId: string, active: boolean): Promise<ActionResult> {
  if (!(await authorize(["super_admin"]))) return DENIED;
  if (!uuid.safeParse(userId).success) return { ok: false, error: "بيانات غير صحيحة." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_active", { p_user: userId, p_active: active });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  // Also block/unblock sign-in at the Auth level (ends their ability to refresh sessions).
  await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
  revalidatePath("/admin/users");
  revalidatePath("/admin/volunteers");
  return ok(active ? "تم تفعيل الحساب." : "تم إيقاف الحساب.");
}
