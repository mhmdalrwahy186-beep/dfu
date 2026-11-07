import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/shell";
import { InviteStaffForm, StaffRowControls } from "@/components/admin/staff-forms";
import { Badge, Card } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatOmaniPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "المشرفون والصلاحيات" };

export default async function UsersPage() {
  const me = await requireStaff(["super_admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, phone, role, is_active, created_at").order("created_at");
  const users = data ?? [];

  return (
    <>
      <PageHeader title="المشرفون والصلاحيات" description="إدارة حسابات الفريق. الصلاحيات مطبّقة على الخادم وقاعدة البيانات." />
      <Card className="mb-6 p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">دعوة عضو جديد</h2>
        <InviteStaffForm />
      </Card>

      <Card className="mb-6 grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div><p className="font-bold">{ROLE_LABELS.super_admin}</p><p className="text-brown-600">صلاحيات كاملة: الإعدادات والحسابات والتقارير وحذف البيانات.</p></div>
        <div><p className="font-bold">{ROLE_LABELS.admin}</p><p className="text-brown-600">إدارة الطلبات والمواعيد والإسناد والعبارات والتصدير.</p></div>
        <div><p className="font-bold">{ROLE_LABELS.coordinator}</p><p className="text-brown-600">عرض الطلبات المسندة إليه فقط وتحديث معلومات الاستلام.</p></div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-cream-200/70 text-brown-700">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-start">
                <th>الاسم</th><th>البريد</th><th>الهاتف</th><th>الصلاحية</th><th>الحالة</th><th>منذ</th><th>إدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-300/60">
              {users.map((u) => (
                <tr key={u.id} className="[&>td]:px-4 [&>td]:py-3">
                  <td className="font-semibold">{u.full_name}</td>
                  <td className="ltr-nums text-brown-700">{u.email}</td>
                  <td className="ltr-nums text-brown-700">{u.phone ? formatOmaniPhone(u.phone) : "—"}</td>
                  <td>{ROLE_LABELS[u.role as Role]}</td>
                  <td>{u.is_active ? <Badge className="bg-[#e1ede5] text-[#3f6b4e] ring-[#c3dccb]">نشط</Badge> : <Badge className="bg-[#ece8e4] text-[#6b625a] ring-[#d8d1ca]">موقوف</Badge>}</td>
                  <td className="text-brown-600">{formatDate(u.created_at, { month: "short" })}</td>
                  <td><StaffRowControls key={`${u.role}-${u.is_active}`} id={u.id} role={u.role as Role} active={u.is_active} isSelf={u.id === me.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
