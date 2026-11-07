import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Inbox, Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Alert, Card, EmptyState, StatusBadge } from "@/components/ui/misc";
import { isAdminRole, requireStaff } from "@/lib/auth";
import { CATEGORY_LABELS, DONATION_STATUSES, QUANTITY_LABELS, STATUS_META, type Category, type DonationStatus, type QuantityOption } from "@/lib/constants";
import { PAGE_SIZE, applyFilters, filtersToSearch, parseFilters, type SortKey } from "@/lib/donation-query";
import { GOVERNORATE_NAMES } from "@/lib/oman";
import { formatOmaniPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "طلبات التبرع" };

type Row = {
  id: string; reference: string; donor_name: string | null; phone: string | null; governorate: string; wilayat: string;
  quantity_option: QuantityOption; quantity_other: string | null; created_at: string; status: DonationStatus;
  assignee: { full_name: string } | null; donation_items: { category: Category }[];
};

export default async function DonationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const f = parseFilters(await searchParams);
  const supabase = await createClient();

  const from = (f.page - 1) * PAGE_SIZE;
  const base = supabase
    .from("donations")
    .select(
      "id, reference, donor_name, phone, governorate, wilayat, quantity_option, quantity_other, created_at, status, assignee:profiles!donations_assigned_to_fkey(full_name), donation_items(category)",
      { count: "exact" },
    );
  const { data, count, error } = await applyFilters(base, f)
    .order(f.sort, { ascending: f.dir === "asc" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(f.q || f.status || f.governorate || f.from || f.to);

  const sortLink = (key: SortKey, label: string) => {
    const dir = f.sort === key && f.dir === "desc" ? "asc" : "desc";
    return (
      <Link href={`/admin/donations${filtersToSearch(f, { sort: key, dir, page: 1 })}`} className="inline-flex items-center gap-1 hover:text-rose-600" aria-sort={f.sort === key ? (f.dir === "asc" ? "ascending" : "descending") : undefined}>
        {label}
        <ArrowDownUp className={`size-3.5 ${f.sort === key ? "text-rose-600" : "opacity-40"}`} />
      </Link>
    );
  };

  return (
    <>
      <PageHeader
        title="طلبات التبرع"
        description={staff.role === "coordinator" ? "الطلبات المسندة إليك." : `${total} طلب${hasFilters ? " مطابق للبحث" : ""}`}
        actions={
          isAdminRole(staff.role) && (
            <>
              <a href={`/api/admin/export${filtersToSearch(f, { page: 1, sort: "created_at", dir: "desc", format: "xlsx" })}`} className={buttonVariants({ variant: "secondary", size: "sm" })} download>
                <Download /> Excel
              </a>
              <a href={`/api/admin/export${filtersToSearch(f, { page: 1, sort: "created_at", dir: "desc", format: "csv" })}`} className={buttonVariants({ variant: "secondary", size: "sm" })} download>
                <Download /> CSV
              </a>
            </>
          )
        }
      />

      {/* Filters (plain GET form: works without JavaScript and keeps URLs shareable) */}
      <Card className="mb-5 p-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search">
          <label className="relative">
            <span className="sr-only">بحث</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-brown-500" />
            <Input name="q" defaultValue={f.q} placeholder="رقم الطلب، الاسم أو رقم الهاتف" className="ps-10" />
          </label>
          <Select name="status" defaultValue={f.status} aria-label="الحالة">
            <option value="">كل الحالات</option>
            <option value="open">قيد المعالجة (الكل)</option>
            {DONATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
          <Select name="governorate" defaultValue={f.governorate} aria-label="المحافظة">
            <option value="">كل المحافظات</option>
            {GOVERNORATE_NAMES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <label>
            <span className="sr-only">من تاريخ</span>
            <Input type="date" name="from" defaultValue={f.from} aria-label="من تاريخ" title="من تاريخ" />
          </label>
          <label>
            <span className="sr-only">إلى تاريخ</span>
            <Input type="date" name="to" defaultValue={f.to} aria-label="إلى تاريخ" title="إلى تاريخ" />
          </label>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">تطبيق</Button>
            {hasFilters && <ButtonLink href="/admin/donations" variant="ghost">مسح</ButtonLink>}
          </div>
        </form>
      </Card>

      {error ? (
        <Alert tone="error">تعذّر تحميل الطلبات. حاول تحديث الصفحة.</Alert>
      ) : rows.length === 0 ? (
        <Card>
          {hasFilters ? (
            <EmptyState icon={<SearchX />} title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو إزالة بعض عوامل التصفية." action={<ButtonLink href="/admin/donations" variant="secondary">مسح عوامل التصفية</ButtonLink>} />
          ) : (
            <EmptyState icon={<Inbox />} title="لا توجد طلبات تبرع بعد" description={staff.role === "coordinator" ? "لم يُسند إليك أي طلب حتى الآن." : "ستظهر الطلبات هنا فور تسجيلها من الموقع."} />
          )}
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-200/70 text-start text-brown-700">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-start [&>th]:font-semibold">
                    <th>{sortLink("reference", "رقم الطلب")}</th>
                    <th>{sortLink("donor_name", "المتبرع")}</th>
                    <th>الهاتف</th>
                    <th>{sortLink("governorate", "المحافظة / الولاية")}</th>
                    <th>الكمية</th>
                    <th>الفئات</th>
                    <th>{sortLink("created_at", "التاريخ")}</th>
                    <th>{sortLink("status", "الحالة")}</th>
                    <th>المتطوع</th>
                    <th><span className="sr-only">إجراءات</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-300/60">
                  {rows.map((r) => (
                    <tr key={r.id} className="transition hover:bg-cream-100 [&>td]:px-4 [&>td]:py-3">
                      <td className="ltr-nums font-semibold text-brown-800">{r.reference}</td>
                      <td>{r.donor_name ?? "—"}</td>
                      <td className="ltr-nums whitespace-nowrap text-brown-700">{formatOmaniPhone(r.phone)}</td>
                      <td>{r.governorate}<span className="block text-xs text-brown-500">{r.wilayat}</span></td>
                      <td className="whitespace-nowrap">{r.quantity_option === "other" ? r.quantity_other : QUANTITY_LABELS[r.quantity_option]}</td>
                      <td className="max-w-40 text-xs text-brown-700">{r.donation_items.map((i) => CATEGORY_LABELS[i.category]).join("، ")}</td>
                      <td className="whitespace-nowrap text-brown-700">{formatDate(r.created_at, { month: "short" })}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-brown-700">{r.assignee?.full_name ?? <span className="text-brown-400">—</span>}</td>
                      <td><ButtonLink href={`/admin/donations/${r.id}`} size="sm" variant="soft">التفاصيل</ButtonLink></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/donations/${r.id}`} className="block rounded-3xl border border-sand-300/80 bg-cream-50 p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <span className="ltr-nums font-bold text-brown-800">{r.reference}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 font-semibold">{r.donor_name ?? "—"}</p>
                  <p className="text-sm text-brown-600">{r.wilayat}، {r.governorate} · {formatDate(r.created_at, { month: "short" })}</p>
                  <p className="mt-1 text-xs text-brown-600">
                    {r.quantity_option === "other" ? r.quantity_other : QUANTITY_LABELS[r.quantity_option]} · {r.donation_items.map((i) => CATEGORY_LABELS[i.category]).join("، ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="الصفحات" className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-brown-600">صفحة <span className="ltr-nums">{f.page}</span> من <span className="ltr-nums">{pages}</span></p>
              <div className="flex gap-2">
                {f.page > 1 && (
                  <ButtonLink href={`/admin/donations${filtersToSearch(f, { page: f.page - 1 })}`} variant="secondary" size="sm">
                    <ChevronRight /> السابق
                  </ButtonLink>
                )}
                {f.page < pages && (
                  <ButtonLink href={`/admin/donations${filtersToSearch(f, { page: f.page + 1 })}`} variant="secondary" size="sm">
                    التالي <ChevronLeft />
                  </ButtonLink>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </>
  );
}
