import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getStaff } from "@/lib/auth";
import { LoginForm } from "../auth-forms";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (isSupabaseConfigured && (await getStaff())) redirect("/admin");
  const { error } = await searchParams;
  const notice = !isSupabaseConfigured
    ? "لم يتم ربط المنصة بقاعدة البيانات بعد. أضف متغيرات Supabase في إعدادات البيئة (راجع DEPLOYMENT.md)."
    : error === "link"
      ? "الرابط غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا."
      : undefined;
  return <LoginForm notice={notice} />;
}
