import Image from "next/image";
import { ArrowLeft, HeartHandshake, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { DonationBoxIllustration } from "@/components/brand/illustrations";
import { QuotesRotator } from "@/components/site/quotes-rotator";
import { Reveal } from "@/components/site/reveal";
import { ImpactNumbers, SectionHeading, StepsGrid } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";
import { Alert, HeartGlyph } from "@/components/ui/misc";
import { getImpactStats, getQuotes, getSettings } from "@/lib/public-data";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, quotes, stats] = await Promise.all([getSettings(), getQuotes(), getImpactStats()]);
  const { home, collection } = settings;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 pb-16 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
          <div className="animate-fade-up text-center lg:text-start">
            <p className="eyebrow mb-5 justify-center rounded-full border border-rose-300/70 bg-cream-50/70 px-4 py-1.5 lg:justify-start">
              <HeartGlyph className="size-3.5" />
              فريق دفء التطوعي · سلطنة عُمان
            </p>
            <h1 className="text-balance font-display text-[2.6rem] font-extrabold leading-[1.3] text-brown-800 sm:text-6xl sm:leading-[1.25]">
              {home.hero_title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-9 text-brown-700 lg:mx-0">
              {home.hero_subtitle}
            </p>
            {!collection.accepting && (
              <Alert tone="warning" className="mx-auto mt-6 max-w-xl text-start lg:mx-0">
                {collection.notice || "نعتذر، استقبال طلبات التبرع متوقف مؤقتًا. تابعنا لمعرفة موعد الاستئناف."}
              </Alert>
            )}
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <ButtonLink href="/donate" size="lg" className="w-full sm:w-auto">
                <HeartHandshake />
                ساهم في نشر الدفء
              </ButtonLink>
              <ButtonLink href="/about" size="lg" variant="secondary" className="w-full sm:w-auto">
                تعرّف على المبادرة
                <ArrowLeft />
              </ButtonLink>
            </div>
            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brown-600 lg:justify-start">
              <li className="flex items-center gap-1.5"><Sparkles className="size-4 text-rose-500" /> بدون تسجيل حساب</li>
              <li className="flex items-center gap-1.5"><Truck className="size-4 text-rose-500" /> نستلم من موقعك</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-rose-500" /> بياناتك محمية</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-b from-cream-50/80 to-rose-200/30 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[2.5rem] border border-sand-300/80 bg-cream-100/80 p-4 shadow-lift sm:p-6">
              <DonationBoxIllustration />
              <div className="absolute -bottom-7 -right-3 rotate-[-4deg] rounded-[1.75rem] border border-sand-300 bg-cream-200 p-2 shadow-lift sm:-right-8">
                <Image
                  src="/brand/daff-logo.jpg"
                  alt="شعار فريق دفء التطوعي"
                  width={132}
                  height={127}
                  priority
                  className="rounded-[1.25rem] mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Quotes ---------- */}
      <section aria-label="عبارات ملهمة" className="border-y border-sand-300/70 bg-cream-100/80">
        <div className="container-page py-12 sm:py-14">
          <QuotesRotator quotes={quotes} />
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="container-page scroll-mt-24 pt-20 sm:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md">
              <div className="aspect-[1290/1232] overflow-hidden rounded-[2.5rem] border border-sand-300/80 bg-cream-200 shadow-lift">
                <Image src="/brand/daff-logo.jpg" alt="شعار فريق دفء التطوعي" width={640} height={615} className="h-full w-full object-cover mix-blend-multiply" />
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 text-center lg:order-2 lg:text-start" delay={0.1}>
            <p className="eyebrow mb-3 justify-center lg:justify-start">
              <HeartGlyph className="size-3.5" /> من نحن
            </p>
            <h2 className="section-title">عن مبادرة دفء</h2>
            <p className="mt-5 text-lg leading-9 text-brown-700">{home.about_text}</p>
            <div className="mt-8 grid gap-4 text-start sm:grid-cols-2">
              <div className="rounded-2xl border border-sand-300/80 bg-cream-50/80 p-5">
                <p className="font-bold text-brown-800">عطاء ميسّر</p>
                <p className="mt-1 text-sm leading-7 text-brown-700">سجّل تبرعك خلال دقائق من جوالك، ونحن نتولى الباقي.</p>
              </div>
              <div className="rounded-2xl border border-sand-300/80 bg-cream-50/80 p-5">
                <p className="font-bold text-brown-800">أثر يصل بكرامة</p>
                <p className="mt-1 text-sm leading-7 text-brown-700">نفرز الملابس بعناية ونوصلها إلى من يحتاجها.</p>
              </div>
            </div>
            <ButtonLink href="/about" variant="ghost" className="mt-6 px-0 text-rose-600 hover:bg-transparent hover:text-rose-600">
              اقرأ المزيد عن المبادرة <ArrowLeft />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="container-page scroll-mt-24 pt-24 sm:pt-32">
        <SectionHeading eyebrow="ثلاث خطوات فقط" title="كيف أتبرع؟" description="رحلة بسيطة من خزانتك إلى من يحتاج الدفء." />
        <StepsGrid />
        <div className="mt-10 text-center">
          <ButtonLink href="/donate" size="lg">
            <HeartHandshake /> تبرع الآن
          </ButtonLink>
        </div>
      </section>

      {/* ---------- Impact ---------- */}
      <section className="container-page pt-24 sm:pt-32">
        <SectionHeading eyebrow="أرقام حقيقية" title="أثر دفء بالأرقام" />
        <ImpactNumbers stats={stats} />
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-page pt-24 sm:pt-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brown-800 px-6 py-14 text-center text-cream-100 shadow-lift sm:px-12">
            <svg className="absolute -left-10 -top-10 size-56 text-brown-700/60" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.6-10-9.3C.4 8.6 2.3 4.5 6.1 4.1 8.4 3.8 10.3 5 12 7c1.7-2 3.6-3.2 5.9-2.9 3.8.4 5.7 4.5 4.1 7.6C19.5 16.4 12 21 12 21Z" />
            </svg>
            <div className="relative">
              <h2 className="font-display text-3xl font-extrabold text-cream-50 sm:text-4xl">لا تترك الخير في خزانتك</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-cream-300">
                قطعة واحدة منك قد تكون دفء ليلة كاملة لغيرك. سجّل تبرعك الآن وسنتواصل معك.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink href="/donate" size="lg" variant="rose" className="w-full sm:w-auto">
                  <HeartHandshake /> تبرع الآن
                </ButtonLink>
                <ButtonLink href="/track" size="lg" className="w-full border border-cream-50/25 bg-transparent text-cream-50 hover:bg-cream-50/10 sm:w-auto">
                  <Search /> متابعة تبرعي
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
