import type { Metadata } from "next";
import { QuotesManager } from "@/components/admin/quotes-manager";
import { PageHeader } from "@/components/admin/shell";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "العبارات التحفيزية" };

export default async function QuotesPage() {
  await requireStaff(["super_admin", "admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("motivational_quotes").select("id, text, is_active, sort_order").order("sort_order");
  const quotes = data ?? [];
  const active = quotes.filter((q) => q.is_active).length;
  return (
    <>
      <PageHeader title="العبارات التحفيزية" description={`${active} عبارة مفعّلة من ${quotes.length}. تظهر المفعّلة بترتيب عشوائي في الصفحة الرئيسية وصفحة نجاح التبرع.`} />
      <QuotesManager quotes={quotes} />
    </>
  );
}
