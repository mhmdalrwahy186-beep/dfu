import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, omanDateKey } from "@/lib/utils";

export const metadata: Metadata = { title: "تقويم الاستلام" };

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type Appt = {
  id: string; scheduled_at: string; status: "scheduled" | "completed" | "cancelled";
  volunteer: { full_name: string } | null;
  donation: { id: string; reference: string; wilayat: string } | null;
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const staff = await requireStaff();
  const { m } = await searchParams;
  const todayKey = omanDateKey(new Date());
  const [y, mo] = (m && /^\d{4}-\d{2}$/.test(m) ? m : todayKey.slice(0, 7)).split("-").map(Number);

  const monthStart = new Date(Date.UTC(y, mo - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const leading = monthStart.getUTCDay(); // 0 = Sunday
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
  const pad = (n: number) => String(n).padStart(2, "0");

  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_appointments")
    .select("id, scheduled_at, status, volunteer:profiles!collection_appointments_volunteer_id_fkey(full_name), donation:donations(id, reference, wilayat)")
    .neq("status", "cancelled")
    .gte("scheduled_at", `${y}-${pad(mo)}-01T00:00:00+04:00`)
    .lt("scheduled_at", `${next}-01T00:00:00+04:00`)
    .order("scheduled_at");
  const appts = (data ?? []) as unknown as Appt[];

  const byDay = new Map<string, Appt[]>();
  for (const a of appts) {
    const k = omanDateKey(a.scheduled_at);
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }
  const time = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Muscat", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const monthName = new Intl.DateTimeFormat("ar-OM-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart);
  const cells = Array.from({ length: Math.ceil((leading + daysInMonth) / 7) * 7 }, (_, i) => i - leading + 1);

  return (
    <>
      <PageHeader
        title="تقويم الاستلام"
        description={staff.role === "coordinator" ? "مواعيدك المؤكدة." : "كل مواعيد الاستلام المؤكدة والمنجزة."}
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/admin/calendar?m=${prev}`} variant="secondary" size="icon" aria-label="الشهر السابق"><ChevronRight /></ButtonLink>
            <span className="min-w-36 text-center font-display text-lg font-bold">{monthName}</span>
            <ButtonLink href={`/admin/calendar?m=${next}`} variant="secondary" size="icon" aria-label="الشهر التالي"><ChevronLeft /></ButtonLink>
            <ButtonLink href="/admin/calendar" variant="ghost" size="sm">اليوم</ButtonLink>
          </div>
        }
      />

      {/* Month grid (tablet & desktop) */}
      <Card className="hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-sand-300/70 bg-cream-200/70 text-center text-sm font-semibold text-brown-700">
          {WEEKDAYS.map((w) => <div key={w} className="py-2.5">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const inMonth = day >= 1 && day <= daysInMonth;
            const key = `${y}-${pad(mo)}-${pad(day)}`;
            const items = inMonth ? byDay.get(key) ?? [] : [];
            return (
              <div key={i} className={cn("min-h-28 border-b border-e border-sand-300/50 p-1.5", !inMonth && "bg-cream-100/60")}>
                {inMonth && (
                  <>
                    <span className={cn("ltr-nums mb-1 inline-grid size-7 place-items-center rounded-full text-xs", key === todayKey ? "bg-brown-800 font-bold text-cream-50" : "text-brown-600")}>{day}</span>
                    <ul className="space-y-1">
                      {items.map((a) => a.donation && (
                        <li key={a.id}>
                          <Link
                            href={`/admin/donations/${a.donation.id}`}
                            className={cn("block rounded-lg px-1.5 py-1 text-[11px] leading-4 transition hover:ring-2 hover:ring-rose-300", a.status === "completed" ? "bg-[#e1ede5] text-[#2f5a3d]" : "bg-[#ebe4f1] text-[#4b3a60]")}
                          >
                            <span className="ltr-nums font-bold">{time(a.scheduled_at)}</span> {a.donation.wilayat}
                            <span className="block truncate opacity-80">{a.volunteer?.full_name ?? "بدون متطوع"}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Agenda list (mobile) */}
      <div className="md:hidden">
        {appts.length === 0 ? (
          <Card><EmptyState icon={<CalendarDays />} title="لا توجد مواعيد في هذا الشهر" /></Card>
        ) : (
          <ul className="space-y-3">
            {[...byDay.entries()].map(([day, items]) => (
              <li key={day}>
                <p className="mb-1.5 text-sm font-bold text-brown-700">{new Intl.DateTimeFormat("ar-OM-u-nu-latn", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}</p>
                <ul className="space-y-2">
                  {items.map((a) => a.donation && (
                    <li key={a.id}>
                      <Link href={`/admin/donations/${a.donation.id}`} className="flex items-center justify-between rounded-2xl border border-sand-300/80 bg-cream-50 px-4 py-3 shadow-soft">
                        <span>
                          <span className="ltr-nums font-bold">{a.donation.reference}</span> · {a.donation.wilayat}
                          <span className="block text-xs text-brown-600">{a.volunteer?.full_name ?? "بدون متطوع"}</span>
                        </span>
                        <span className="ltr-nums font-display text-lg font-bold">{time(a.scheduled_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      {appts.length === 0 && <p className="mt-4 hidden text-center text-sm text-brown-500 md:block">لا توجد مواعيد استلام في هذا الشهر.</p>}
    </>
  );
}
