import type { Metadata } from "next";
import { CalendarCheck2, MapPin, Package } from "lucide-react";
import { SectionHeading } from "@/components/site/sections";
import { TrackForm, TrackLogout } from "@/components/track/track-form";
import { Alert, StatusBadge } from "@/components/ui/misc";
import { CATEGORY_LABELS, QUANTITY_LABELS, STATUS_META, type Category, type QuantityOption } from "@/lib/constants";
import { smsProvider } from "@/lib/server-env";
import { getTrackedDonation } from "@/lib/tracking";
import { cn, formatDate, formatDateTime, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "متابعة تبرعي", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const donation = await getTrackedDonation();

  return (
    <div className="container-page max-w-3xl pt-6 sm:pt-10">
      <SectionHeading eyebrow="متابعة آمنة" title="متابعة تبرعي" description="تابع حالة طلب تبرعك خطوة بخطوة." />

      {!donation ? (
        <TrackForm enabled={smsProvider() !== null} />
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-brown-600">رقم الطلب</p>
                <p className="ltr-nums font-display text-2xl font-extrabold text-brown-800">{donation.reference}</p>
                <p className="mt-1 text-sm text-brown-600">تاريخ التسجيل: {formatDate(donation.created_at)}</p>
              </div>
              <StatusBadge status={donation.status} className="px-3.5 py-1.5 text-sm" />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-brown-700 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-rose-500" /> {donation.wilayat}، محافظة {donation.governorate}
              </p>
              <p className="flex items-center gap-2">
                <Package className="size-4 text-rose-500" />
                {donation.quantity_option === "other" ? donation.quantity_other : QUANTITY_LABELS[donation.quantity_option as QuantityOption]}
                {" · "}
                {donation.categories.map((c) => CATEGORY_LABELS[c as Category]).join("، ")}
              </p>
            </div>
          </div>

          {donation.appointment && (
            <Alert tone="success" title="موعد الاستلام المؤكد">
              <p className="flex items-center gap-2">
                <CalendarCheck2 className="size-4" />
                {formatDate(donation.appointment.scheduled_at, { weekday: "long" })} — الساعة {formatTime(donation.appointment.scheduled_at)}
              </p>
            </Alert>
          )}
          {donation.status === "cancelled" && (
            <Alert tone="warning" title="تم إلغاء الطلب">
              للاستفسار أو لإعادة تسجيل التبرع يسعدنا تواصلك مع الفريق.
            </Alert>
          )}

          <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-soft sm:p-8">
            <h2 className="mb-6 text-lg font-bold">مراحل الطلب</h2>
            <ol className="relative space-y-6 ps-8">
              <span className="absolute inset-y-2 start-[0.6875rem] w-0.5 bg-sand-300" aria-hidden="true" />
              {donation.timeline.map((step) => (
                <li key={step.status} className="relative" aria-current={step.current ? "step" : undefined}>
                  <span
                    className={cn(
                      "absolute -start-8 top-0.5 grid size-6 place-items-center rounded-full border-2",
                      step.reached ? "border-brown-800 bg-brown-800" : "border-sand-400 bg-cream-50",
                      step.current && "ring-4 ring-rose-300/60",
                    )}
                    aria-hidden="true"
                  >
                    {step.reached && <span className="size-2 rounded-full bg-cream-50" />}
                  </span>
                  <p className={cn("font-semibold", step.reached ? "text-brown-800" : "text-brown-500")}>
                    {STATUS_META[step.status].donorLabel}
                  </p>
                  {step.at && step.reached && <p className="text-[13px] text-brown-600">{formatDateTime(step.at)}</p>}
                </li>
              ))}
            </ol>
          </div>
          <TrackLogout />
        </div>
      )}
    </div>
  );
}
