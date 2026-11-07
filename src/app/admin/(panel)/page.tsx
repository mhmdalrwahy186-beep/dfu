import Link from "next/link";
import { CalendarClock, CheckCheck, ClipboardList, Inbox, Loader, PackageCheck, XCircle } from "lucide-react";
import { MonthlyChart, StatusChart } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Card, EmptyState, StatusBadge } from "@/components/ui/misc";
import { isAdminRole, requireStaff } from "@/lib/auth";
import type { DonationStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatNumber, relativeTime } from "@/lib/utils";

type Stats = {
  total: number; new: number; in_progress: number; received: number; completed: number; cancelled: number;
  upcoming_appointments: number; by_status: Partial<Record<DonationStatus, number>>; monthly: { month: string; count: number }[];
};

const ACTION_LABELS: Record<string, string> = {
  "donation.status_changed": "حدّث حالة طلب",
  "donation.assigned": "أسند طلبًا لمتطوع",
  "donation.note_added": "أضاف ملاحظة داخلية",
  "appointment.created": "حدد موعد استلام",
  "appointment.rescheduled": "عدّل موعد استلام",
  "appointment.cancelled": "ألغى موعد استلام",
  "appointment.notes_updated": "حدّث ملاحظات الاستلام",
  "donation.anonymized": "حذف البيانات الشخصية لطلب",
};

function StatCard({ icon: Icon, label, value, href }: { icon: typeof Inbox; label: string; value: number; href?: string }) {
  const body = (
    <Card className="flex h-full items-center gap-4 p-5 transition hover:shadow-lift">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sand-300/60 text-brown-700"><Icon className="size-5" /></span>
      <span>
        <span className="ltr-nums block font-display text-3xl font-extrabold text-brown-800">{formatNumber(value)}</span>
        <span className="text-sm text-brown-600">{label}</span>
      </span>
    </Card>
  );
  return href ? <Link href={href} className="rounded-3xl">{body}</Link> : body;
}

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const staff = await requireStaff();
  const { denied } = await searchParams;
  const supabase = await createClient();

  if (!isAdminRole(staff.role)) {
    // ----- Volunteer coordinator view -----
    const [{ data: cs }, { data: upcoming }] = await Promise.all([
      supabase.rpc("coordinator_stats"),
      supabase
        .from("collection_appointments")
        .select("id, scheduled_at, donations(id, reference, donor_name, wilayat, governorate)")
        .eq("status", "scheduled")
        .gte("ends_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(10),
    ]);
    const s = (cs ?? {}) as Record<string, number>;
    return (
      <>
        <PageHeader title={`أهلًا ${staff.full_name}`} description="هذه الطلبات المسندة إليك." />
        {denied && <Alert tone="warning" className="mb-5">ليست لديك صلاحية للوصول إلى تلك الصفحة.</Alert>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="طلبات مفتوحة مسندة إليك" value={s.assigned_open ?? 0} href="/admin/donations" />
          <StatCard icon={CalendarClock} label="مواعيد قادمة" value={s.upcoming_appointments ?? 0} href="/admin/calendar" />
          <StatCard icon={Loader} label="بانتظار الاستلام" value={s.awaiting ?? 0} />
          <StatCard icon={PackageCheck} label="تم استلامها" value={s.received ?? 0} />
        </div>
        <Card className="mt-6 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">مواعيدي القادمة</h2>
          {!upcoming?.length ? (
            <EmptyState icon={<CalendarClock />} title="لا توجد مواعيد قادمة" description="ستظهر هنا مواعيد الاستلام المسندة إليك." />
          ) : (
            <ul className="divide-y divide-sand-300/70">
              {upcoming.map((a) => {
                const d = a.donations as unknown as { id: string; reference: string; donor_name: string; wilayat: string; governorate: string } | null;
                return d ? (
                  <li key={a.id}>
                    <Link href={`/admin/donations/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-rose-600">
                      <span><span className="ltr-nums font-semibold">{d.reference}</span> · {d.donor_name} · {d.wilayat}</span>
                      <span className="text-sm text-brown-600">{formatDateTime(a.scheduled_at)}</span>
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </Card>
      </>
    );
  }

  // ----- Admin view -----
  const [{ data: statsData, error }, { data: recent }, { data: activity }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.from("donations").select("id, reference, donor_name, wilayat, governorate, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("audit_logs").select("id, action, entity_id, created_at, profiles(full_name)").eq("entity", "donation").order("created_at", { ascending: false }).limit(8),
  ]);
  const stats = statsData as Stats | null;

  return (
    <>
      <PageHeader title="نظرة عامة" description="ملخص حي لطلبات التبرع من قاعدة البيانات." actions={<ButtonLink href="/admin/donations?status=new" size="sm">عرض الطلبات الجديدة</ButtonLink>} />
      {denied && <Alert tone="warning" className="mb-5">ليست لديك صلاحية للوصول إلى تلك الصفحة.</Alert>}
      {error || !stats ? (
        <Alert tone="error">تعذّر تحميل الإحصاءات. تأكد من تطبيق ملفات قاعدة البيانات (migrations).</Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={ClipboardList} label="إجمالي طلبات التبرع" value={stats.total} href="/admin/donations" />
            <StatCard icon={Inbox} label="الطلبات الجديدة" value={stats.new} href="/admin/donations?status=new" />
            <StatCard icon={Loader} label="الطلبات قيد المعالجة" value={stats.in_progress} href="/admin/donations?status=open" />
            <StatCard icon={CalendarClock} label="مواعيد الاستلام القادمة" value={stats.upcoming_appointments} href="/admin/calendar" />
            <StatCard icon={PackageCheck} label="التبرعات المستلمة" value={stats.received} href="/admin/donations?status=received" />
            <StatCard icon={CheckCheck} label="الطلبات المكتملة" value={stats.completed} href="/admin/donations?status=completed" />
            <StatCard icon={XCircle} label="الطلبات الملغاة" value={stats.cancelled} href="/admin/donations?status=cancelled" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold">طلبات التبرع شهريًا</h2>
              <p className="mb-4 text-sm text-brown-600">آخر 12 شهرًا</p>
              <MonthlyChart data={stats.monthly} />
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold">توزيع الطلبات حسب الحالة</h2>
              {stats.total === 0 ? <EmptyState title="لا توجد طلبات بعد" /> : <StatusChart byStatus={stats.by_status} />}
            </Card>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">أحدث الطلبات</h2>
            <Link href="/admin/donations" className="text-sm text-rose-600 hover:underline">عرض الكل</Link>
          </div>
          {!recent?.length ? (
            <EmptyState icon={<Inbox />} title="لا توجد طلبات تبرع بعد" description="ستظهر الطلبات هنا فور تسجيلها من الموقع." />
          ) : (
            <ul className="divide-y divide-sand-300/70">
              {recent.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/donations/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:text-rose-600">
                    <span>
                      <span className="ltr-nums font-semibold">{d.reference}</span>
                      <span className="text-brown-600"> · {d.donor_name ?? "—"} · {d.wilayat}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-brown-500">{relativeTime(d.created_at)}</span>
                      <StatusBadge status={d.status as DonationStatus} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">آخر نشاطات الفريق</h2>
          {!activity?.length ? (
            <EmptyState title="لا يوجد نشاط بعد" />
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" />
                  <span>
                    <span className="font-semibold">{(a.profiles as unknown as { full_name: string } | null)?.full_name ?? "النظام"}</span>{" "}
                    {ACTION_LABELS[a.action] ?? a.action}
                    {a.entity_id && (
                      <> — <Link className="text-rose-600 hover:underline" href={`/admin/donations/${a.entity_id}`}>عرض</Link></>
                    )}
                    <span className="block text-xs text-brown-500">{relativeTime(a.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
