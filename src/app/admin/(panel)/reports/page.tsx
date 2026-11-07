import type { Metadata } from "next";
import { Download } from "lucide-react";
import { MonthlyChart, StatusChart } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Alert, Card, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { DONATION_STATUSES, STATUS_META, type DonationStatus } from "@/lib/constants";
import { GOVERNORATE_NAMES } from "@/lib/oman";
import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "الإحصاءات والتقارير" };

export default async function ReportsPage() {
  await requireStaff(["super_admin", "admin"]);
  const supabase = await createClient();
  const [{ data: stats }, { data: impact }] = await Promise.all([supabase.rpc("admin_dashboard_stats"), supabase.rpc("public_impact_stats")]);
  const s = stats as {
    total: number;
    by_status: Partial<Record<DonationStatus, number>>;
    by_governorate: Record<string, number>;
    monthly: { month: string; count: number }[];
  } | null;
  const im = impact as { completed_donations: number; received_bags: number; received_pieces: number; received_donations: number } | null;
  const govSorted = Object.entries(s?.by_governorate ?? {}).sort((a, b) => b[1] - a[1]);
  const maxGov = govSorted[0]?.[1] ?? 1;

  return (
    <>
      <PageHeader title="الإحصاءات والتقارير" description="أرقام مستخرجة مباشرة من سجلات قاعدة البيانات." />

      {!s ? (
        <Alert tone="error">تعذّر تحميل الإحصاءات.</Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "إجمالي الطلبات", value: s.total },
              { label: "تبرعات مستلمة أو مكتملة", value: im?.received_donations ?? 0 },
              { label: "أكياس مستلمة", value: im?.received_bags ?? 0 },
              { label: "قطع مستلمة (مسجلة)", value: im?.received_pieces ?? 0 },
            ].map((c) => (
              <Card key={c.label} className="p-5">
                <p className="ltr-nums font-display text-3xl font-extrabold text-brown-800">{formatNumber(c.value)}</p>
                <p className="text-sm text-brown-600">{c.label}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold">الطلبات شهريًا (آخر 12 شهرًا)</h2><MonthlyChart data={s.monthly} /></Card>
            <Card className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold">الطلبات حسب الحالة</h2>{s.total ? <StatusChart byStatus={s.by_status} /> : <EmptyState title="لا توجد بيانات بعد" />}</Card>
          </div>
          <Card className="mt-6 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">الطلبات حسب المحافظة</h2>
            {govSorted.length === 0 ? <EmptyState title="لا توجد بيانات بعد" /> : (
              <ul className="space-y-2.5">
                {govSorted.map(([g, n]) => (
                  <li key={g} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                    <span className="text-brown-800">{g}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-sand-300/50">
                      <span className="block h-full rounded-full bg-brown-700" style={{ width: `${(n / maxGov) * 100}%` }} />
                    </span>
                    <span className="ltr-nums text-end font-semibold">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-lg font-bold">تصدير سجلات التبرع</h2>
        <p className="mb-4 mt-1 text-sm text-brown-600">يحتوي الملف على بيانات شخصية للمتبرعين. احفظه في مكان آمن، ولا تشاركه إلا مع المخوّلين. تُسجَّل كل عملية تصدير.</p>
        <form action="/api/admin/export" method="get" className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div><Label htmlFor="ex-format" required>الصيغة</Label><Select id="ex-format" name="format" defaultValue="xlsx"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV</option></Select></div>
          <div><Label htmlFor="ex-status">الحالة</Label><Select id="ex-status" name="status" defaultValue=""><option value="">الكل</option><option value="open">قيد المعالجة</option>{DONATION_STATUSES.map((st) => <option key={st} value={st}>{STATUS_META[st].label}</option>)}</Select></div>
          <div><Label htmlFor="ex-gov">المحافظة</Label><Select id="ex-gov" name="governorate" defaultValue=""><option value="">الكل</option>{GOVERNORATE_NAMES.map((g) => <option key={g} value={g}>{g}</option>)}</Select></div>
          <div><Label htmlFor="ex-from">من تاريخ</Label><Input id="ex-from" type="date" name="from" /></div>
          <div><Label htmlFor="ex-to">إلى تاريخ</Label><Input id="ex-to" type="date" name="to" /></div>
          <div className="flex items-end"><Button type="submit" className="w-full"><Download /> تصدير</Button></div>
        </form>
      </Card>
    </>
  );
}
