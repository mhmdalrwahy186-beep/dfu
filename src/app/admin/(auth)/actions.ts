"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";
import { clientIp, hashIdentifier, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
});

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ip = hashIdentifier(await clientIp());
  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 10, 900),
    rateLimit(`login:email:${hashIdentifier(parsed.data.email)}`, 5, 900),
  ]);
  if (!ipOk || !emailOk) return { error: "محاولات دخول كثيرة. يرجى الانتظار 15 دقيقة ثم المحاولة مرة أخرى." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };

  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب غير مفعّل للوصول إلى لوحة التحكم." };
  }
  redirect("/admin");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "البريد الإلكتروني غير صحيح" };

  const ip = hashIdentifier(await clientIp());
  if (!(await rateLimit(`reset:ip:${ip}`, 5, 3600))) return { error: "طلبات كثيرة. حاول لاحقًا." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${SITE_URL}/admin/reset-password` });
  // Same answer whether or not the account exists.
  return { message: "إذا كان البريد مسجلًا لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور." };
}

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) return { error: "يجب ألا تقل كلمة المرور عن 10 أحرف." };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: "استخدم أحرفًا وأرقامًا في كلمة المرور." };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "انتهت صلاحية الرابط. اطلب رابطًا جديدًا." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "تعذّر تحديث كلمة المرور. جرّب كلمة مرور أقوى." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
