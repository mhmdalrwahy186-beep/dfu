import type { Metadata } from "next";
import { DonationForm } from "@/components/donate/donation-form";
import { HeartDivider, HeartGlyph } from "@/components/ui/misc";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "تبرع الآن",
  description: "سجّل تبرعك بالملابس لدى فريق دفء التطوعي خلال دقائق، وسيتواصل معك الفريق لتنسيق الاستلام.",
};
export const revalidate = 60;

export default async function DonatePage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl pb-6 pt-6 sm:pt-10">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-3 justify-center">
          <HeartGlyph className="size-3.5" /> تبرع الآن
        </p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">ساهم في نشر الدفء</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-brown-700">
          املأ النموذج التالي، وسيتواصل معك فريق دفء لتنسيق موعد وموقع الاستلام. الحقول المعلّمة بـ <span className="text-rose-600">*</span> مطلوبة.
        </p>
        <HeartDivider className="mt-6" />
      </div>
      <DonationForm accepting={settings.collection.accepting} notice={settings.collection.notice} />
    </div>
  );
}
