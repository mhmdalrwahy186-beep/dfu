import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { MarkAllRead } from "@/components/admin/mark-read";
import { PageHeader } from "@/components/admin/shell";
import { Card, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "الإشعارات" };

const TYPE_LABEL: Record<string, string> = {
  new_donation: "طلب جديد",
  status_changed: "تحديث حالة",
  appointment_updated: "موعد استلام",
  collection_completed: "استلام مكتمل",
  assignment: "إسناد",
};

export default async function NotificationsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, donation_id, read_at, created_at")
    .eq("recipient_id", staff.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader title="الإشعارات" description={unread ? `${unread} غير مقروءة` : "لا توجد إشعارات غير مقروءة"} actions={unread > 0 && <MarkAllRead />} />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<BellOff />} title="لا توجد إشعارات" description="ستصلك هنا إشعارات الطلبات الجديدة وتحديثات المواعيد فور حدوثها." />
        ) : (
          <ul className="divide-y divide-sand-300/60">
            {items.map((n) => {
              const content = (
                <div className="flex gap-3 px-5 py-4">
                  <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", n.read_at ? "bg-sand-400" : "bg-rose-500")} aria-hidden="true" />
                  <div className="flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sand-300/70 px-2 py-0.5 text-[11px] font-semibold text-brown-700">{TYPE_LABEL[n.type] ?? n.type}</span>
                      <span className={cn("text-[15px]", !n.read_at && "font-bold")}>{n.title}</span>
                      {!n.read_at && <span className="sr-only">(غير مقروء)</span>}
                    </p>
                    {n.body && <p className="mt-0.5 text-sm text-brown-600">{n.body}</p>}
                    <p className="mt-1 text-xs text-brown-500">{relativeTime(n.created_at)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id} className={cn(!n.read_at && "bg-rose-200/20")}>
                  {n.donation_id ? <Link href={`/admin/donations/${n.donation_id}`} className="block transition hover:bg-cream-100">{content}</Link> : content}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
