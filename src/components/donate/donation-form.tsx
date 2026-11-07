"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Baby, CalendarClock, Check, HeartHandshake, MapPin, Shirt, User, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { LocationPicker } from "@/components/donate/location-picker";
import { PhotoUploader, type PhotoItem } from "@/components/donate/photo-uploader";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  PERIODS,
  PERIOD_LABELS,
  QUANTITY_LABELS,
  QUANTITY_OPTIONS,
} from "@/lib/constants";
import { GOVERNORATE_NAMES, wilayatsOf } from "@/lib/oman";
import { cn } from "@/lib/utils";
import { donationSchema, type DonationFormInput, type DonationFormValues } from "@/lib/validation/donation";

const CATEGORY_ICONS = { men: User, women: UserRound, children: Baby, mixed: Users } as const;

type ApiResult =
  | { ok: true; reference: string; token: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-5 shadow-soft sm:p-8">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-200/70 text-rose-600 [&_svg]:size-5">{icon}</span>
        <div>
          <h2 className="text-lg font-bold sm:text-xl" aria-hidden="true">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm leading-6 text-brown-600">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

/** Large tappable option used for radios and checkboxes. */
function OptionCard({ checked, children, className }: { checked: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-full min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-3 text-[15px] font-medium transition peer-focus-visible:ring-4 peer-focus-visible:ring-rose-300/60",
        checked
          ? "border-brown-800 bg-brown-800 text-cream-50 shadow-soft"
          : "border-sand-400/70 bg-cream-50 text-brown-800 hover:border-caramel-500 hover:bg-cream-100",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border transition",
          checked ? "border-cream-50 bg-cream-50 text-brown-800" : "border-caramel-500",
        )}
        aria-hidden="true"
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {children}
    </span>
  );
}

export function DonationForm({ accepting, notice }: { accepting: boolean; notice?: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string>("");
  const openedAt = useRef<number>(0);

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    openedAt.current = Date.now();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<DonationFormInput, unknown, DonationFormValues>({
    resolver: zodResolver(donationSchema),
    mode: "onTouched",
    defaultValues: {
      donor_name: "",
      phone: "",
      whatsapp: "",
      governorate: "",
      wilayat: "",
      address: "",
      address_details: "",
      categories: [],
      quantity_other: "",
      estimated_pieces: "",
      preferred_period: "any",
      preferred_date: "",
      notes: "",
      consent: false as unknown as true,
      idempotency_key: "00000000-0000-4000-8000-000000000000",
      website: "",
      elapsed_ms: 0,
    },
  });

  const governorate = watch("governorate");
  const categories = (watch("categories") ?? []) as string[];
  const quantity = watch("quantity_option");
  const condition = watch("condition");
  const period = watch("preferred_period");
  const lat = watch("latitude");
  const lng = watch("longitude");
  const position: [number, number] | null = lat !== undefined && lng !== undefined && lat !== "" ? [Number(lat), Number(lng)] : null;

  useEffect(() => {
    setValue("wilayat", "");
  }, [governorate, setValue]);

  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat" }).format(new Date());

  function onInvalid(errs: FieldErrors<DonationFormInput>) {
    const first = Object.keys(errs)[0] as keyof DonationFormInput | undefined;
    if (first) {
      try {
        setFocus(first);
      } catch {
        document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  async function onSubmit(values: DonationFormValues) {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const body = new FormData();
      body.set(
        "data",
        JSON.stringify({
          ...values,
          idempotency_key: idempotencyKey.current,
          elapsed_ms: Date.now() - openedAt.current,
        }),
      );
      photos.forEach((p) => body.append("photos", p.file, p.file.name));

      const res = await fetch("/api/donations", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as ApiResult | null;

      if (!res.ok || !json || !json.ok) {
        const msg = json && !json.ok ? json.error : "تعذّر إرسال الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
        if (json && !json.ok && json.fieldErrors) {
          for (const [k, v] of Object.entries(json.fieldErrors)) {
            setError(k as keyof DonationFormInput, { message: v });
          }
        }
        setServerError(msg);
        setSubmitting(false);
        return;
      }
      // Success is shown only after the database confirmed the record.
      router.replace(`/donate/success?ref=${encodeURIComponent(json.reference)}&t=${encodeURIComponent(json.token)}`);
    } catch {
      setServerError("تعذّر إرسال الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
      setSubmitting(false);
    }
  }

  if (!accepting) {
    return (
      <Alert tone="warning" title="استقبال التبرعات متوقف مؤقتًا">
        {notice || "نعتذر، لا نستقبل طلبات تبرع جديدة حاليًا. يسعدنا عودتك قريبًا."}
      </Alert>
    );
  }

  const err = (k: keyof DonationFormInput) => errors[k]?.message as string | undefined;
  const aria = (k: keyof DonationFormInput) => ({
    id: `field-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `field-${k}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6" aria-busy={submitting}>
      {/* Honeypot (hidden from people and assistive tech) */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          الموقع الإلكتروني
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <Section icon={<User />} title="بياناتك" description="لنتواصل معك ونرتّب استلام التبرع.">
        <Field label="الاسم الكامل" htmlFor="field-donor_name" required error={err("donor_name")}>
          <Input {...aria("donor_name")} autoComplete="name" placeholder="مثال: سالم بن محمد البلوشي" {...register("donor_name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="رقم الهاتف" htmlFor="field-phone" required error={err("phone")} hint="رقم عُماني من 8 أرقام">
            <div className="flex" dir="ltr">
              <span className="inline-flex h-12 items-center rounded-s-xl border border-e-0 border-sand-400/70 bg-sand-300/50 px-3 text-[15px] font-semibold text-brown-700">
                +968
              </span>
              <Input
                {...aria("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9XXX XXXX"
                className="rounded-s-none text-left"
                {...register("phone")}
              />
            </div>
          </Field>
          <Field label="رقم واتساب (إن كان مختلفًا)" htmlFor="field-whatsapp" error={err("whatsapp")}>
            <div className="flex" dir="ltr">
              <span className="inline-flex h-12 items-center rounded-s-xl border border-e-0 border-sand-400/70 bg-sand-300/50 px-3 text-[15px] font-semibold text-brown-700">
                +968
              </span>
              <Input {...aria("whatsapp")} type="tel" inputMode="tel" placeholder="9XXX XXXX" className="rounded-s-none text-left" {...register("whatsapp")} />
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={<MapPin />} title="موقع الاستلام" description="أين يمكن لفريقنا استلام التبرع؟">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="المحافظة" htmlFor="field-governorate" required error={err("governorate")}>
            <Select {...aria("governorate")} {...register("governorate")}>
              <option value="">اختر المحافظة</option>
              {GOVERNORATE_NAMES.map((g) => (
                <option key={g} value={g}>
                  محافظة {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الولاية" htmlFor="field-wilayat" required error={err("wilayat")}>
            <Select {...aria("wilayat")} disabled={!governorate} {...register("wilayat")}>
              <option value="">{governorate ? "اختر الولاية" : "اختر المحافظة أولًا"}</option>
              {wilayatsOf(governorate ?? "").map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="وصف الموقع" htmlFor="field-address" required error={err("address")}>
          <Textarea
            {...aria("address")}
            rows={3}
            className="min-h-24"
            placeholder="مثال: الحي، رقم السكة، رقم المنزل، أو أقرب معلم"
            {...register("address")}
          />
        </Field>
        <Field label="تفاصيل إضافية عن الموقع" htmlFor="field-address_details" error={err("address_details")}>
          <Input {...aria("address_details")} placeholder="مثال: البوابة البنية بجانب المسجد" {...register("address_details")} />
        </Field>
        <LocationPicker
          governorate={governorate}
          value={position}
          onChange={(v) => {
            setValue("latitude", v ? v[0] : undefined, { shouldValidate: true });
            setValue("longitude", v ? v[1] : undefined, { shouldValidate: true });
          }}
        />
        <FieldError message={err("latitude")} />
      </Section>

      <Section icon={<Shirt />} title="معلومات الملابس">
        <div id="field-categories" tabIndex={-1}>
          <Label required>فئات الملابس</Label>
          <p className="-mt-1 mb-3 text-[13px] text-brown-600">يمكنك اختيار أكثر من فئة.</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              return (
                <label key={c} className="block">
                  <input type="checkbox" value={c} className="peer sr-only" {...register("categories")} />
                  <OptionCard checked={categories.includes(c)}>
                    <Icon className="size-4 opacity-80" aria-hidden="true" />
                    {CATEGORY_LABELS[c]}
                  </OptionCard>
                </label>
              );
            })}
          </div>
          <FieldError id="field-categories-error" message={err("categories")} />
        </div>

        <div id="field-quantity_option" tabIndex={-1}>
          <Label required>الكمية التقريبية</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUANTITY_OPTIONS.map((q) => (
              <label key={q} className="block">
                <input type="radio" value={q} className="peer sr-only" {...register("quantity_option")} />
                <OptionCard checked={quantity === q}>{QUANTITY_LABELS[q]}</OptionCard>
              </label>
            ))}
          </div>
          <FieldError id="field-quantity_option-error" message={err("quantity_option")} />
        </div>

        {quantity === "other" && (
          <Field label="وضّح الكمية" htmlFor="field-quantity_other" required error={err("quantity_other")}>
            <Input {...aria("quantity_other")} placeholder="مثال: 3 صناديق كبيرة" {...register("quantity_other")} />
          </Field>
        )}

        <Field label="العدد التقريبي لقطع الملابس" htmlFor="field-estimated_pieces" error={err("estimated_pieces")}>
          <Input
            {...aria("estimated_pieces")}
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            placeholder="مثال: 40"
            className="sm:max-w-60"
            {...register("estimated_pieces")}
          />
        </Field>

        <div id="field-condition" tabIndex={-1}>
          <Label required>حالة الملابس</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {CONDITIONS.map((c) => (
              <label key={c} className="block">
                <input type="radio" value={c} className="peer sr-only" {...register("condition")} />
                <OptionCard checked={condition === c}>{CONDITION_LABELS[c]}</OptionCard>
              </label>
            ))}
          </div>
          <FieldError id="field-condition-error" message={err("condition")} />
          <p className="mt-3 rounded-2xl bg-rose-200/50 px-4 py-3 text-sm leading-7 text-brown-800">
            🤍 نرجو أن تكون الملابس المتبرع بها نظيفة وصالحة لإعادة الاستخدام، ويخضع قبولها لإرشادات الفريق.
          </p>
        </div>

        <div>
          <Label>صور الملابس</Label>
          <PhotoUploader value={photos} onChange={setPhotos} disabled={submitting} />
        </div>
      </Section>

      <Section icon={<CalendarClock />} title="الوقت المفضل للاستلام">
        <div id="field-preferred_period" tabIndex={-1}>
          <Label required>الفترة المفضلة</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {PERIODS.map((p) => (
              <label key={p} className="block">
                <input type="radio" value={p} className="peer sr-only" {...register("preferred_period")} />
                <OptionCard checked={period === p}>{PERIOD_LABELS[p]}</OptionCard>
              </label>
            ))}
          </div>
        </div>
        <Field
          label="التاريخ المفضل"
          htmlFor="field-preferred_date"
          error={err("preferred_date")}
          hint="هذا التاريخ تفضيل منك وليس موعدًا مؤكدًا. سيتواصل معك الفريق لتأكيد الموعد."
        >
          <Input {...aria("preferred_date")} type="date" min={todayIso} className="sm:max-w-60" {...register("preferred_date")} />
        </Field>
        <Field label="ملاحظات إضافية" htmlFor="field-notes" error={err("notes")}>
          <Textarea {...aria("notes")} placeholder="هل هناك تفاصيل تساعد فريقنا في استلام التبرع؟" maxLength={1000} {...register("notes")} />
        </Field>
      </Section>

      <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-5 shadow-soft sm:p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            {...aria("consent")}
            className="mt-1 size-5 shrink-0 cursor-pointer accent-brown-800"
            {...register("consent")}
          />
          <span className="leading-7 text-brown-800">
            أوافق على استخدام بياناتي لغرض التواصل معي وتنسيق استلام التبرع وفق{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4">
              سياسة الخصوصية
            </Link>
            .<span className="text-rose-600"> *</span>
          </span>
        </label>
        <FieldError id="field-consent-error" message={err("consent")} />

        {serverError && (
          <Alert tone="error" className="mt-5">
            {serverError}
          </Alert>
        )}

        <Button type="submit" size="lg" className="mt-6 w-full" loading={submitting}>
          {!submitting && <HeartHandshake />}
          {submitting ? "جارٍ إرسال طلبك…" : "إرسال طلب التبرع"}
        </Button>
        <p className="mt-3 text-center text-[13px] text-brown-600">لا يلزم إنشاء حساب. سيتواصل معك فريق دفء لتأكيد موعد الاستلام.</p>
      </div>
    </form>
  );
}
