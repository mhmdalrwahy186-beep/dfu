"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { inviteStaff, setStaffActive, setStaffRole, type ActionResult } from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

export function InviteStaffForm({ fixedRole }: { fixedRole?: Role }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: fixedRole ?? ("coordinator" as Role) });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await inviteStaff(form);
          setResult(r);
          if (r.ok) setForm({ full_name: "", email: "", phone: "", role: fixedRole ?? "coordinator" });
        });
      }}
    >
      <Field label="الاسم الكامل" htmlFor="inv-name" required>
        <Input id="inv-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      </Field>
      <Field label="البريد الإلكتروني" htmlFor="inv-email" required>
        <Input id="inv-email" type="email" dir="ltr" className="text-left" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </Field>
      <Field label="رقم الهاتف" htmlFor="inv-phone">
        <Input id="inv-phone" type="tel" dir="ltr" className="text-left" placeholder="9XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      {!fixedRole && (
        <Field label="الصلاحية" htmlFor="inv-role" required>
          <Select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
      )}
      <div className="md:col-span-2">
        <Button type="submit" loading={pending}>
          {!pending && <UserPlus />} إرسال دعوة
        </Button>
        <p className="mt-2 text-xs text-brown-600">يصل العضو بريد دعوة لتعيين كلمة المرور. لا يوجد تسجيل عام للحسابات.</p>
        {result && <Alert tone={result.ok ? "success" : "error"} className="mt-3">{result.ok ? result.message : result.error}</Alert>}
      </div>
    </form>
  );
}

export function StaffRowControls({ id, role, active, isSelf }: { id: string; role: Role; active: boolean; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (isSelf) return <span className="text-xs text-brown-500">حسابك</span>;
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : r.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="تغيير الصلاحية"
        className="h-9 rounded-xl border border-sand-400/70 bg-cream-50 px-2 text-sm"
        defaultValue={role}
        disabled={pending}
        onChange={(e) => run(() => setStaffRole(id, e.target.value))}
      >
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      <Button
        size="sm"
        variant={active ? "secondary" : "soft"}
        loading={pending}
        onClick={() => {
          if (!active || confirm("إيقاف الحساب يمنع الدخول ويلغي إسناد طلباته المفتوحة. متابعة؟")) run(() => setStaffActive(id, !active));
        }}
      >
        {active ? "إيقاف" : "تفعيل"}
      </Button>
      {error && <span role="alert" className="w-full text-xs text-[#a24b3c]">{error}</span>}
    </div>
  );
}
