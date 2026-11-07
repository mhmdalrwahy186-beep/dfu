import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة دفء" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", staff.id)
    .is("read_at", null);

  return (
    <AdminShell user={{ id: staff.id, full_name: staff.full_name, role: staff.role }} unread={count ?? 0} signOutAction={signOut}>
      {children}
    </AdminShell>
  );
}
