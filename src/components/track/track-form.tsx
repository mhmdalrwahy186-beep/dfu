"use client";

import { KeyRound, LogOut, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function TrackForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!enabled) {
    return (
      <Alert tone="info" title="المتابعة الذاتية غير متاحة حاليًا">
        يتطلب عرض حالة الطلب التحقق من رقم هاتفك برسالة نصية، وهذه الخدمة لم تُفعّل بعد. سيتواصل معك فريق دفء لإطلاعك على حالة تبرعك، ويمكنك التواصل معنا عبر صفحة «تواصل معنا».
      </Alert>
    );
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, phone }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error);
      else {
        setInfo(json.message);
        setStep("code");
      }
    } catch {
      setError("تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, phone, code }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch {
      setError("تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-soft sm:p-8">
      {step === "details" ? (
        <form onSubmit={requestCode} className="space-y-5" noValidate>
          <Field label="رقم الطلب" htmlFor="ref" required>
            <Input id="ref" dir="ltr" className="text-left uppercase" placeholder="DF-26-00012" value={reference} onChange={(e) => setReference(e.target.value)} required autoComplete="off" />
          </Field>
          <Field label="رقم الهاتف المسجّل في الطلب" htmlFor="tphone" required>
            <Input id="tphone" dir="ltr" className="text-left" type="tel" inputMode="tel" placeholder="9XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {!loading && <Search />} إرسال رمز التحقق
          </Button>
          <p className="flex items-start gap-2 text-[13px] leading-6 text-brown-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-rose-500" />
            لحماية خصوصيتك، نرسل رمزًا لمرة واحدة إلى رقم الهاتف المسجّل في الطلب قبل عرض أي تفاصيل.
          </p>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-5" noValidate>
          {info && <Alert tone="info">{info}</Alert>}
          <Field label="رمز التحقق" htmlFor="code" required hint="أدخل الرمز المكوّن من 6 أرقام. صالح لمدة 10 دقائق.">
            <Input
              id="code"
              dir="ltr"
              className="text-center font-display text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {!loading && <KeyRound />} تحقق وعرض الحالة
          </Button>
          <button type="button" className="w-full text-sm text-brown-600 underline-offset-4 hover:underline" onClick={() => { setStep("details"); setCode(""); setError(null); }}>
            تعديل البيانات أو إعادة إرسال الرمز
          </button>
        </form>
      )}
    </div>
  );
}

export function TrackLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <div className="text-center">
      <Button
        variant="ghost"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          await fetch("/api/track/logout", { method: "POST" });
          router.refresh();
        }}
      >
        {!loading && <LogOut />} إنهاء جلسة المتابعة
      </Button>
    </div>
  );
}
