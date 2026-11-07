import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarCheck2, ExternalLink, History, Images, MapPin, MessageCircle, Phone, Shirt, StickyNote, User } from "lucide-react";
import {
  AnonymizePanel,
  AssignPanel,
  CollectionNotesPanel,
  NoteForm,
  SchedulePanel,
  StatusPanel,
  type StaffOption,
} from "@/components/admin/donation-actions";
import { ReadonlyMap } from "@/components/admin/readonly-map";
import { buttonVariants } from "@/components/ui/button";
import { Alert, Card, StatusBadge } from "@/components/ui/misc";
import { isAdminRole, requireStaff } from "@/lib/auth";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  PERIOD_LABELS,
  QUANTITY_LABELS,
  STATUS_META,
  type Category,
  type Condition,
  type DonationStatus,
  type Period,
  type QuantityOption,
} from "@/lib/constants";
import { formatOmaniPhone } from "@/lib/phone";
import { DONATION_BUCKET } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate, formatDateTime, omanDateKey } from "@/lib/utils";
import { DONOR_WHATSAPP_MESSAGE, telLink, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

type Donation = {
  id: string; reference: string; donor_name: string | null; phone: string | null; whatsapp: string | null;
  governorate: string; wilayat: string; address: string | null; address_details: string | null;
  latitude: number | null; longitude: number | null; quantity_option: QuantityOption; quantity_other: string | null;
  estimated_pieces: number | null; condition: Condition; preferred_period: Period; preferred_date: string | null;
  notes: string | null; status: DonationStatus; assigned_to: string | null; received_bags: number | null;
  received_pieces: number | null; anonymized_at: string | null; created_at: string; consent_at: string;
  assignee: { full_name: string } | null; donation_items: { category: Category }[];
  donation_images: { id: string; storage_path: string }[];
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-brown-600">{label}</dt>
      <dd className="font-medium text-brown-900">{children}</dd>
    </div>
  );
}

export default async function DonationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const staff = await requireStaff();
  const admin = isAdminRole(staff.role);
  const supabase = await createClient();

  // RLS returns nothing if this user may not see the donation.
  const { data } = await supabase
    .from("donations")
    .select("*, assignee:profiles!donations_assigned_to_fkey(full_name), donation_items(category), donation_images(id, storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const d = data as unknown as Donation;

  const [history, notes, appts, staffList, signed] = await Promise.all([
    supabase
      .from("donation_status_history")
      .select("id, from_status, to_status, note, created_at, changer:profiles!donation_status_history_changed_by_fkey(full_name)")
      .eq("donation_id", id)
      .order("created_at", { ascending: false }),
    admin
      ? supabase.from("donation_notes").select("id, body, created_at, author:profiles!donation_notes_author_id_fkey(full_name)").eq("donation_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("collection_appointments")
      .select("id, scheduled_at, duration_minutes, status, notes, volunteer_id, volunteer:profiles!collection_appointments_volunteer_id_fkey(full_name)")
      .eq("donation_id", id)
      .order("scheduled_at", { ascending: false }),
    admin ? supabase.from("profiles").select("id, full_name, role").eq("is_active", true).order("full_name") : Promise.resolve({ data: [] as never[] }),
    d.donation_images.length
      ? supabase.storage.from(DONATION_BUCKET).createSignedUrls(d.donation_images.map((i) => i.storage_path), 600)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
  ]);

  const appointments = (appts.data ?? []) as unknown as {
    id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null; volunteer_id: string | null; volunteer: { full_name: string } | null;
  }[];
  const active = appointments.find((a) => a.status === "scheduled") ?? null;
  const staffOptions = (staffList.data ?? []) as StaffOption[];
  const wa = whatsappLink(d.whatsapp ?? d.phone, DONOR_WHATSAPP_MESSAGE);
  const tel = telLink(d.phone);
  const closed = ["received", "completed", "cancelled"].includes(d.status);
  const timeOf = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Muscat", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

  return (
    <>
      <Link href="/admin/donations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brown-600 hover:text-rose-600">
        <ArrowRight className="size-4" /> كل الطلبات
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="ltr-nums font-display text-2xl font-extrabold sm:text-3xl">{d.reference}</h1>
            <StatusBadge status={d.status} className="px-3 py-1 text-sm" />
          </div>
          <p className="mt-1 text-sm text-brown-600">سُجّل في {formatDateTime(d.created_at)}</p>
        </div>
        {!d.anonymized_at && (
          <div className="flex flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "whatsapp" })}>
                <MessageCircle /> تواصل عبر واتساب
              </a>
            )}
            {tel && (
              <a href={tel} className={buttonVariants({ variant: "secondary" })}>
                <Phone /> اتصال هاتفي
              </a>
            )}
          </div>
        )}
      </div>
      {wa && !d.anonymized_at && (
        <p className="-mt-3 mb-5 text-xs text-brown-500">يفتح زر واتساب محادثة برسالة جاهزة؛ تُرسل الرسالة فقط عند ضغطك «إرسال» داخل واتساب.</p>
      )}
      {d.anonymized_at && <Alert tone="info" className="mb-5">تم حذف البيانات الشخصية لهذا الطلب في {formatDate(d.anonymized_at)} ضمن سياسة الاحتفاظ بالبيانات.</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><User className="size-5 text-rose-500" /> بيانات المتبرع</h2>
            <dl className="divide-y divide-sand-300/60">
              <Row label="الاسم الكامل">{d.donor_name ?? "—"}</Row>
              <Row label="رقم الهاتف"><span className="ltr-nums">{formatOmaniPhone(d.phone) || "—"}</span></Row>
              <Row label="واتساب"><span className="ltr-nums">{d.whatsapp ? formatOmaniPhone(d.whatsapp) : "نفس رقم الهاتف"}</span></Row>
              <Row label="الموافقة على الخصوصية">{formatDateTime(d.consent_at)}</Row>
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><MapPin className="size-5 text-rose-500" /> الموقع</h2>
            <dl className="divide-y divide-sand-300/60">
              <Row label="المحافظة / الولاية">{d.governorate} — {d.wilayat}</Row>
              <Row label="وصف الموقع"><span className="whitespace-pre-line">{d.address ?? "—"}</span></Row>
              {d.address_details && <Row label="تفاصيل إضافية">{d.address_details}</Row>}
            </dl>
            {d.latitude !== null && d.longitude !== null ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-sand-300">
                <ReadonlyMap lat={Number(d.latitude)} lng={Number(d.longitude)} />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-cream-100 py-2.5 text-sm font-semibold text-brown-700 hover:text-rose-600"
                >
                  <ExternalLink className="size-4" /> فتح في خرائط Google للملاحة
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-brown-500">لم يحدد المتبرع موقعًا على الخريطة.</p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><Shirt className="size-5 text-rose-500" /> تفاصيل التبرع</h2>
            <dl className="divide-y divide-sand-300/60">
              <Row label="الفئات">{d.donation_items.map((i) => CATEGORY_LABELS[i.category]).join("، ")}</Row>
              <Row label="الكمية">{d.quantity_option === "other" ? d.quantity_other ?? "كمية أخرى" : QUANTITY_LABELS[d.quantity_option]}</Row>
              <Row label="عدد القطع التقريبي"><span className="ltr-nums">{d.estimated_pieces ?? "—"}</span></Row>
              <Row label="الحالة">{CONDITION_LABELS[d.condition]}</Row>
              <Row label="الفترة المفضلة">{PERIOD_LABELS[d.preferred_period]}</Row>
              <Row label="التاريخ المفضل">{d.preferred_date ? `${formatDate(d.preferred_date + "T12:00:00+04:00", { weekday: "long" })} (تفضيل)` : "—"}</Row>
              <Row label="ملاحظات المتبرع"><span className="whitespace-pre-line">{d.notes ?? "—"}</span></Row>
              {(d.received_bags !== null || d.received_pieces !== null) && (
                <Row label="المستلم فعليًا">
                  <span className="ltr-nums">{d.received_bags ?? "—"}</span> كيس
                  {d.received_pieces !== null && <> · <span className="ltr-nums">{d.received_pieces}</span> قطعة</>}
                </Row>
              )}
            </dl>
          </Card>

          {d.donation_images.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Images className="size-5 text-rose-500" /> صور الملابس</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(signed.data ?? []).map((s, i) =>
                  s.signedUrl ? (
                    <li key={i}>
                      <a href={s.signedUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-2xl border border-sand-300 bg-cream-100">
                        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived private signed URL */}
                        <img src={s.signedUrl} alt={`صورة الملابس ${i + 1}`} className="h-full w-full object-cover transition hover:scale-105" loading="lazy" />
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
              <p className="mt-2 text-xs text-brown-500">روابط الصور خاصة ومؤقتة (10 دقائق).</p>
            </Card>
          )}

          {appointments.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><CalendarCheck2 className="size-5 text-rose-500" /> مواعيد الاستلام</h2>
              <ul className="space-y-2">
                {appointments.map((a) => (
                  <li key={a.id} className={cn("rounded-2xl border px-4 py-3 text-sm", a.status === "scheduled" ? "border-[#d5c8e3] bg-[#f4f0f8]" : "border-sand-300/70 bg-cream-100 text-brown-600")}>
                    <p className="font-semibold">
                      {formatDate(a.scheduled_at, { weekday: "long" })} — <span className="ltr-nums">{timeOf(a.scheduled_at)}</span>
                      <span className="ms-2 text-xs font-normal">({a.status === "scheduled" ? "مؤكد" : a.status === "completed" ? "تم" : "ملغي"})</span>
                    </p>
                    <p className="text-brown-600">المتطوع: {a.volunteer?.full_name ?? "غير محدد"} · المدة {a.duration_minutes} دقيقة</p>
                    {a.notes && <p className="mt-1 whitespace-pre-line text-brown-700">{a.notes}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><History className="size-5 text-rose-500" /> سجل الحالات</h2>
            <ol className="relative space-y-4 ps-6">
              <span className="absolute inset-y-1 start-[0.4375rem] w-px bg-sand-400" aria-hidden="true" />
              {((history.data ?? []) as unknown as { id: string; from_status: DonationStatus | null; to_status: DonationStatus; note: string | null; created_at: string; changer: { full_name: string } | null }[]).map((h) => (
                <li key={h.id} className="relative">
                  <span className={cn("absolute -start-6 top-1.5 size-3.5 rounded-full ring-4 ring-cream-50", STATUS_META[h.to_status].dot)} aria-hidden="true" />
                  <p className="text-sm">
                    {h.from_status ? <>{STATUS_META[h.from_status].label} ← </> : null}
                    <span className="font-semibold">{STATUS_META[h.to_status].label}</span>
                  </p>
                  <p className="text-xs text-brown-500">
                    {h.changer?.full_name ?? (h.from_status ? "—" : "المتبرع عبر الموقع")} · {formatDateTime(h.created_at)}
                  </p>
                  {h.note && <p className="mt-1 rounded-xl bg-cream-100 px-3 py-2 text-sm text-brown-700">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>

          {admin && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><StickyNote className="size-5 text-rose-500" /> ملاحظات داخلية</h2>
              <p className="mb-4 text-xs text-brown-500">مرئية للمشرفين فقط، ولا تظهر للمتبرع أو المتطوعين.</p>
              {!d.anonymized_at && <NoteForm donationId={d.id} />}
              <ul className="mt-4 space-y-3">
                {((notes.data ?? []) as unknown as { id: string; body: string; created_at: string; author: { full_name: string } | null }[]).map((n) => (
                  <li key={n.id} className="rounded-2xl bg-cream-100 px-4 py-3">
                    <p className="whitespace-pre-line text-sm text-brown-800">{n.body}</p>
                    <p className="mt-1 text-xs text-brown-500">{n.author?.full_name ?? "—"} · {formatDateTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {!d.anonymized_at && <StatusPanel key={d.status} donationId={d.id} status={d.status} role={staff.role} receivedBags={d.received_bags} />}
          {admin && !d.anonymized_at && (
            <>
              <SchedulePanel
                key={active?.id ?? "none"}
                donationId={d.id}
                disabled={closed}
                staff={staffOptions}
                defaultVolunteer={active?.volunteer_id ?? d.assigned_to}
                current={active ? { id: active.id, date: omanDateKey(active.scheduled_at), time: timeOf(active.scheduled_at), duration: active.duration_minutes, notes: active.notes } : null}
              />
              <AssignPanel key={d.assigned_to ?? "none"} donationId={d.id} assignedTo={d.assigned_to} staff={staffOptions} />
            </>
          )}
          {!admin && active && active.volunteer_id === staff.id && (
            <CollectionNotesPanel appointmentId={active.id} donationId={d.id} notes={active.notes} />
          )}
          {!admin && (
            <Card className="p-5 text-sm text-brown-600">المتطوع المسؤول: <span className="font-semibold text-brown-800">{d.assignee?.full_name ?? "—"}</span></Card>
          )}
          {staff.role === "super_admin" && !d.anonymized_at && (d.status === "completed" || d.status === "cancelled") && <AnonymizePanel donationId={d.id} />}
        </aside>
      </div>
    </>
  );
}
