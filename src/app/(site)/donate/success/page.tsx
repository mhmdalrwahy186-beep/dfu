import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Home, Search } from "lucide-react";
import { SuccessAnimation } from "@/components/donate/success-animation";
import { CopyReference } from "@/components/donate/copy-reference";
import { QuotesRotator } from "@/components/site/quotes-rotator";
import { ButtonLink } from "@/components/ui/button";
import { getQuotes } from "@/lib/public-data";
import { verifyToken } from "@/lib/security";

export const metadata: Metadata = { title: "تم استلام طلبك", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ref?: string; t?: string }> }) {
  const { ref, t } = await searchParams;
  // The link is signed by the server after the database confirmed the record.
  let token: { ref: string } | null = null;
  try {
    token = verifyToken<{ ref: string }>(t);
  } catch {
    token = null; // APP_SECRET missing
  }
  if (!ref || !token || token.ref !== ref) redirect("/donate");

  const quotes = await getQuotes();

  return (
    <div className="container-page max-w-2xl pt-8 sm:pt-14">
      <div className="rounded-[2.5rem] border border-sand-300/80 bg-cream-50/90 px-6 py-12 text-center shadow-lift sm:px-12">
        <SuccessAnimation />
        <h1 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">شكرًا لأنك ساهمت في نشر الدفء 🤎</h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-brown-700">
          تم استلام طلب تبرعك بنجاح، وسيتواصل معك فريق دفء التطوعي لتنسيق الاستلام.
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-caramel-400 bg-cream-100 px-5 py-4">
          <p className="text-sm text-brown-600">رقم طلب التبرع</p>
          <CopyReference reference={ref} />
          <p className="mt-1 text-[13px] text-brown-600">احتفظ بهذا الرقم لمتابعة حالة تبرعك.</p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            <Home /> العودة للرئيسية
          </ButtonLink>
          <ButtonLink href="/track" size="lg" variant="secondary">
            <Search /> متابعة تبرعي
          </ButtonLink>
        </div>
      </div>
      <div className="mt-12">
        <QuotesRotator quotes={quotes} variant="compact" />
      </div>
    </div>
  );
}
