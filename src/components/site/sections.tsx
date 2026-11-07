import { HandHeart, Package, Shirt } from "lucide-react";
import { StepIcon } from "@/components/brand/illustrations";
import { Reveal } from "@/components/site/reveal";
import { HeartDivider, HeartGlyph } from "@/components/ui/misc";
import type { ImpactStats } from "@/lib/public-data";
import { formatNumber } from "@/lib/utils";

export const STEPS = [
  { n: "01", title: "سجّل تبرعك", text: "أدخل بياناتك وحدد الملابس التي ترغب بالتبرع بها." },
  { n: "02", title: "نتواصل معك", text: "سيتواصل معك فريق دفء لتنسيق موعد وموقع الاستلام." },
  { n: "03", title: "اصنع الأثر", text: "نستلم تبرعك ونعمل على إيصاله إلى مستحقيه." },
] as const;

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
      {eyebrow && (
        <p className="eyebrow mb-3 justify-center">
          <HeartGlyph className="size-3.5" />
          {eyebrow}
        </p>
      )}
      <h2 className="section-title">{title}</h2>
      {description && <p className="mt-4 text-[17px] leading-8 text-brown-700">{description}</p>}
      <HeartDivider className="mt-6" />
    </div>
  );
}

export function StepsGrid() {
  return (
    <ol className="relative grid gap-5 md:grid-cols-3 md:gap-6">
      <div className="pointer-events-none absolute inset-x-[16%] top-[3.25rem] hidden border-t-2 border-dashed border-caramel-400/60 md:block" aria-hidden="true" />
      {STEPS.map((s, i) => (
        <li key={s.n}>
          <Reveal delay={i * 0.12} className="h-full">
            <div className="group relative h-full rounded-3xl border border-sand-300/80 bg-cream-50/90 p-7 text-center shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="relative mx-auto mb-5 grid size-[4.5rem] place-items-center rounded-full bg-cream-200 text-brown-800 ring-8 ring-cream-50 transition group-hover:bg-rose-200 group-hover:text-rose-600">
                <StepIcon step={(i + 1) as 1 | 2 | 3} />
                <span className="ltr-nums absolute -top-1 -left-1 grid size-7 place-items-center rounded-full bg-brown-800 text-xs font-bold text-cream-50">
                  {s.n}
                </span>
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-7 text-brown-700">{s.text}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function ImpactNumbers({ stats }: { stats: ImpactStats | null }) {
  const hasData = stats && (stats.completed_donations > 0 || stats.received_bags > 0);
  if (!hasData) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-caramel-400/70 bg-cream-50/70 px-6 py-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-rose-200 text-rose-600">
          <HandHeart className="size-7" />
        </div>
        <p className="font-display text-xl font-bold text-brown-800">أثرنا يبدأ معك</p>
        <p className="mt-2 leading-7 text-brown-700">
          ستظهر هنا أرقام حقيقية عن التبرعات المكتملة والأكياس المستلمة بمجرد إتمامها. كن أول من يصنع الأثر.
        </p>
      </div>
    );
  }
  const items = [
    { icon: HandHeart, value: stats.completed_donations, label: "تبرعًا مكتملًا" },
    { icon: Package, value: stats.received_bags, label: "كيس ملابس مستلم" },
    ...(stats.pieces_recorded > 0 && stats.received_pieces > 0
      ? [{ icon: Shirt, value: stats.received_pieces, label: "قطعة ملابس (تقديرية)" }]
      : []),
  ];
  return (
    <div className={`mx-auto grid max-w-4xl gap-5 ${items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {items.map((it, i) => (
        <Reveal key={it.label} delay={i * 0.1}>
          <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-7 text-center shadow-soft">
            <it.icon className="mx-auto mb-3 size-8 text-rose-500" aria-hidden="true" />
            <p className="ltr-nums font-display text-4xl font-extrabold text-brown-800">{formatNumber(it.value)}</p>
            <p className="mt-1 text-brown-700">{it.label}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
