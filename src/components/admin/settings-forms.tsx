"use client";

import { Save } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { saveSettings, type ActionResult } from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/misc";
import type { SiteSettings } from "@/lib/settings-defaults";

function Section<K extends keyof SiteSettings>({
  sectionKey,
  title,
  description,
  initial,
  children,
}: {
  sectionKey: K;
  title: string;
  description?: string;
  initial: SiteSettings[K];
  children: (value: SiteSettings[K], set: (patch: Partial<SiteSettings[K]>) => void) => ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-brown-600">{description}</p>}
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setResult(await saveSettings(sectionKey, value)));
        }}
      >
        {children(value, (patch) => setValue((v) => ({ ...v, ...patch })))}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={pending}>{!pending && <Save />} حفظ</Button>
          {result && <Alert tone={result.ok ? "success" : "error"} className="py-2">{result.ok ? result.message : result.error}</Alert>}
        </div>
      </form>
    </Card>
  );
}

export function SettingsForms({ initial }: { initial: SiteSettings }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section sectionKey="collection" title="استقبال التبرعات" description="أوقف استقبال الطلبات مؤقتًا عند الحاجة (مثلًا عند امتلاء المخزن)." initial={initial.collection}>
        {(v, set) => (
          <>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-5 accent-brown-800" checked={v.accepting} onChange={(e) => set({ accepting: e.target.checked })} />
              <span className="font-semibold">نستقبل طلبات تبرع جديدة</span>
            </label>
            <Field label="رسالة للزوار عند الإيقاف" htmlFor="col-notice">
              <Textarea id="col-notice" className="min-h-20" value={v.notice} onChange={(e) => set({ notice: e.target.value })} />
            </Field>
          </>
        )}
      </Section>

      <Section sectionKey="contact" title="معلومات التواصل" description="تظهر في التذييل وصفحة «تواصل معنا». اترك الحقل فارغًا لإخفائه." initial={initial.contact}>
        {(v, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="رقم الهاتف" htmlFor="c-phone"><Input id="c-phone" dir="ltr" className="text-left" value={v.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
            <Field label="رقم واتساب" htmlFor="c-wa"><Input id="c-wa" dir="ltr" className="text-left" value={v.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
            <Field label="البريد الإلكتروني" htmlFor="c-email"><Input id="c-email" dir="ltr" className="text-left" value={v.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="العنوان" htmlFor="c-addr"><Input id="c-addr" value={v.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            <Field label="أوقات التواصل" htmlFor="c-hours" className="sm:col-span-2"><Input id="c-hours" value={v.hours} onChange={(e) => set({ hours: e.target.value })} /></Field>
          </div>
        )}
      </Section>

      <Section sectionKey="social" title="حسابات التواصل الاجتماعي" description="الروابط الرسمية فقط، وتبدأ بـ https://" initial={initial.social}>
        {(v, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["instagram", "إنستغرام"],
                ["x", "إكس"],
                ["tiktok", "تيك توك"],
                ["snapchat", "سناب شات"],
                ["facebook", "فيسبوك"],
                ["youtube", "يوتيوب"],
              ] as const
            ).map(([k, label]) => (
              <Field key={k} label={label} htmlFor={`s-${k}`}>
                <Input id={`s-${k}`} dir="ltr" className="text-left" placeholder="https://" value={v[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<SiteSettings["social"]>)} />
              </Field>
            ))}
          </div>
        )}
      </Section>

      <Section sectionKey="team" title="معلومات الفريق" initial={initial.team}>
        {(v, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الفريق" htmlFor="t-name" required><Input id="t-name" value={v.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="الشعار النصي" htmlFor="t-tag"><Input id="t-tag" value={v.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
            </div>
            <Field label="نبذة (صفحة عن المبادرة)" htmlFor="t-about"><Textarea id="t-about" value={v.about} onChange={(e) => set({ about: e.target.value })} /></Field>
            <Field label="رسالتنا" htmlFor="t-mission"><Textarea id="t-mission" value={v.mission} onChange={(e) => set({ mission: e.target.value })} /></Field>
          </>
        )}
      </Section>

      <Section sectionKey="home" title="محتوى الصفحة الرئيسية" initial={initial.home}>
        {(v, set) => (
          <>
            <Field label="العنوان الرئيسي" htmlFor="h-title" required><Input id="h-title" value={v.hero_title} onChange={(e) => set({ hero_title: e.target.value })} /></Field>
            <Field label="الوصف" htmlFor="h-sub"><Textarea id="h-sub" value={v.hero_subtitle} onChange={(e) => set({ hero_subtitle: e.target.value })} /></Field>
            <Field label="نص «عن مبادرة دفء»" htmlFor="h-about"><Textarea id="h-about" value={v.about_text} onChange={(e) => set({ about_text: e.target.value })} /></Field>
          </>
        )}
      </Section>

      <Section sectionKey="privacy" title="سياسة الخصوصية" description="يدعم: ## للعناوين، - للقوائم، **نص** للتغميق." initial={initial.privacy}>
        {(v, set) => (
          <>
            <Field label="تاريخ آخر تحديث" htmlFor="p-date" required><Input id="p-date" type="date" className="sm:max-w-60" value={v.updated_at} onChange={(e) => set({ updated_at: e.target.value })} /></Field>
            <Field label="نص السياسة" htmlFor="p-content" required><Textarea id="p-content" className="min-h-96 font-mono text-sm" value={v.content} onChange={(e) => set({ content: e.target.value })} /></Field>
          </>
        )}
      </Section>
    </div>
  );
}
