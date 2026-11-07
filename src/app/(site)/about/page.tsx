import type { Metadata } from "next";
import Image from "next/image";
import { HandHeart, HeartHandshake, Recycle, ShieldCheck } from "lucide-react";
import { QuotesRotator } from "@/components/site/quotes-rotator";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";
import { getQuotes, getSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "عن المبادرة",
  description: "تعرّف على مبادرة دفء التطوعية للتبرع بالملابس في سلطنة عُمان.",
};
export const revalidate = 300;

const VALUES = [
  { icon: HandHeart, title: "العطاء", text: "نؤمن أن أبسط عطاء قد يصنع أعظم أثر." },
  { icon: Recycle, title: "الاستدامة", text: "نمنح الملابس الصالحة حياة ثانية بدل أن تُهدر." },
  { icon: ShieldCheck, title: "الأمانة", text: "نتعامل مع تبرعك وبياناتك بمسؤولية وشفافية." },
  { icon: HeartHandshake, title: "الكرامة", text: "نوصل الملابس لمستحقيها بطريقة تحفظ كرامتهم." },
];

export default async function AboutPage() {
  const [settings, quotes] = await Promise.all([getSettings(), getQuotes()]);
  return (
    <div className="container-page pt-6 sm:pt-10">
      <SectionHeading eyebrow="من نحن" title="عن مبادرة دفء" />
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="mx-auto max-w-md overflow-hidden rounded-[2.5rem] border border-sand-300/80 bg-cream-200 shadow-lift">
            <Image src="/brand/daff-logo.jpg" alt="شعار فريق دفء التطوعي" width={640} height={615} priority className="h-auto w-full mix-blend-multiply" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-2xl font-bold">{settings.team.name}</h2>
          <p className="mt-4 text-lg leading-9 text-brown-700">{settings.team.about}</p>
          <p className="mt-4 text-lg leading-9 text-brown-700">{settings.team.mission}</p>
          <ButtonLink href="/donate" size="lg" className="mt-8">
            <HeartHandshake /> ساهم في نشر الدفء
          </ButtonLink>
        </Reveal>
      </div>

      <section className="pt-24">
        <SectionHeading eyebrow="ما نؤمن به" title="قيمنا" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-soft">
                <v.icon className="mb-4 size-8 text-rose-500" aria-hidden="true" />
                <h3 className="text-lg font-bold">{v.title}</h3>
                <p className="mt-1.5 leading-7 text-brown-700">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-[2.5rem] border border-sand-300/70 bg-cream-100/80 px-6 py-12">
        <QuotesRotator quotes={quotes} />
      </section>
    </div>
  );
}
