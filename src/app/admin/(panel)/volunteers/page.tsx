import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { InviteStaffForm, StaffRowControls } from "@/components/admin/staff-forms";
import { Badge, Card, EmptyState, StatusBadge } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import type { DonationStatus, Role } from "@/lib/constants";
import { formatOmaniPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "المتطوعون" };

export default async function VolunteersPage() {
  const me = await requireStaff(["super_admin", "admin"]);
  const supabase = await createClient();
  const [{ data: vols }, { data: open }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, role, is_active").eq("role", "coordinator").order("is_active", { ascending: false }).order("full_name"),
    supabase
      .from("donations")
      .select("id, reference, wilayat, status, assigned_to")
      .not("assigned_to", "is", null)
      .not("status", "in", "(completed,cancelled)")
      .order("created_at"),
  ]);

  const byVolunteer = new Map<string, { id: string; reference: string; wilayat: string; status: DonationStatus }[]>();
  for (const d of open ?? []) byVolunteer.set(d.assigned_to!, [...(byVolunteer.get(d.assigned_to!) ?? []), d as never]);
  const isSuper = me.role === "super_admin";

  return (
    <>
      <PageHeader title="المتطوعون" description="منسقو المتطوعين والطلبات المفتوحة المسندة إليهم." />
      {isSuper && (
        <Card className="mb-6 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">إضافة متطوع</h2>
          <InviteStaffForm fixedRole="coordinator" />
        </Card>
      )}
      {!vols?.length ? (
        <Card><EmptyState icon={<Users />} title="لا يوجد متطوعون بعد" description={isSuper ? "أضف أول متطوع عبر النموذج أعلاه." : "يضيف المشرف العام حسابات المتطوعين."} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vols.map((v) => {
            const assigned = byVolunteer.get(v.id) ?? [];
            const wa = whatsappLink(v.phone);
            return (
              <Card key={v.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{v.full_name}</p>
                    <p className="ltr-nums text-sm text-brown-600">{v.email}{v.phone ? ` · ${formatOmaniPhone(v.phone)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!v.is_active && <Badge className="bg-[#ece8e4] text-[#6b625a] ring-[#d8d1ca]">موقوف</Badge>}
                    <Badge className="bg-sand-300/70 text-brown-700 ring-sand-400"><span className="ltr-nums">{assigned.length}</span> طلب مفتوح</Badge>
                  </div>
                </div>
                {assigned.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {assigned.map((d) => (
                      <li key={d.id}>
                        <Link href={`/admin/donations/${d.id}`} className="flex items-center justify-between rounded-xl bg-cream-100 px-3 py-2 text-sm hover:bg-sand-300/50">
                          <span><span className="ltr-nums font-semibold">{d.reference}</span> · {d.wilayat}</span>
                          <StatusBadge status={d.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand-300/60 pt-3">
                  {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#1f8f55] hover:underline">مراسلة عبر واتساب</a> : <span />}
                  {isSuper && <StaffRowControls key={`${v.is_active}`} id={v.id} role={v.role as Role} active={v.is_active} isSelf={v.id === me.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
