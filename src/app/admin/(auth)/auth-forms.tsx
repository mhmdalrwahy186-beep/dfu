"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import { requestPasswordReset, signIn, updatePassword, type AuthState } from "./actions";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-brown-600">لوحة تحكم فريق دفء التطوعي</p>
      </div>
      {notice && <Alert tone="warning">{notice}</Alert>}
      <Field label="البريد الإلكتروني" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" className="text-left" autoComplete="username" required />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" required>
        <Input id="password" name="password" type="password" dir="ltr" className="text-left" autoComplete="current-password" required />
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {!pending && <LogIn />} دخول
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="text-rose-600 underline-offset-4 hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
        <p className="mt-1 text-sm text-brown-600">سنرسل رابط إعادة التعيين إلى بريدك.</p>
      </div>
      <Field label="البريد الإلكتروني" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" className="text-left" autoComplete="username" required />
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {!pending && <Mail />} إرسال الرابط
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-rose-600 underline-offset-4 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </form>
  );
}

export function NewPasswordForm({ welcome }: { welcome?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{welcome ? "مرحبًا بك في فريق دفء" : "تعيين كلمة مرور جديدة"}</h1>
        <p className="mt-1 text-sm text-brown-600">10 أحرف على الأقل، وتتضمن حروفًا وأرقامًا.</p>
      </div>
      <Field label="كلمة المرور الجديدة" htmlFor="password" required>
        <Input id="password" name="password" type="password" dir="ltr" className="text-left" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="confirm" required>
        <Input id="confirm" name="confirm" type="password" dir="ltr" className="text-left" autoComplete="new-password" minLength={10} required />
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {!pending && <KeyRound />} حفظ كلمة المرور
      </Button>
    </form>
  );
}
