import type { Metadata } from "next";
import { CheckCircle2, HeartHandshake, XCircle } from "lucide-react";
import { SectionHeading, StepsGrid } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "كيف أتبرع؟",
  description: "خطوات التبرع بالملابس مع فريق دفء التطوعي، وإرشادات تجهيز الملابس قبل الاستلام.",
};

const DO = [
  "ملابس نظيفة ومغسولة وجاهزة للاستخدام.",
  "قطع بحالة جيدة دون تمزق أو بقع واضحة.",
  "تجميع الملابس في أكياس محكمة الإغلاق.",
  "فصل ملابس الأطفال عن ملابس الكبار إن أمكن.",
];
const DONT = [
  "الملابس الممزقة أو التالفة بشكل كبير.",
  "الملابس المبللة أو ذات الرائحة.",
  "الملابس الداخلية المستعملة.",
];

const FAQ = [
  { q: "هل أحتاج إلى إنشاء حساب؟", a: "لا. يكفي ملء نموذج التبرع، وسيتواصل معك الفريق مباشرة." },
  { q: "متى سيتم الاستلام؟", a: "بعد تسجيل طلبك يتواصل معك الفريق لتحديد موعد مناسب. التاريخ الذي تختاره في النموذج تفضيل وليس موعدًا مؤكدًا." },
  { q: "هل يمكنني متابعة حالة تبرعي؟", a: "نعم، من صفحة «متابعة تبرعي» باستخدام رقم الطلب ورقم هاتفك، بعد التحقق برمز يصلك في رسالة نصية." },
  { q: "هل تُشارك بياناتي مع أي جهة؟", a: "لا. تُستخدم بياناتك لتنسيق الاستلام فقط، ولا يطّلع عليها إلا أعضاء الفريق المخوّلون." },
];

export default function HowItWorksPage() {
  return (
    <div className="container-page pt-6 sm:pt-10">
      <SectionHeading eyebrow="ثلاث خطوات فقط" title="كيف أتبرع؟" description="رحلة بسيطة من خزانتك إلى من يحتاج الدفء." />
      <StepsGrid />

      <section className="mt-20 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-7 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="size-6 text-[#4f7a4f]" /> نستقبل بكل سرور
          </h2>
          <ul className="space-y-3">
            {DO.map((d) => (
              <li key={d} className="flex gap-2.5 leading-7 text-brown-700">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#4f7a4f]" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-7 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <XCircle className="size-6 text-[#a24b3c]" /> نعتذر عن استقبال
          </h2>
          <ul className="space-y-3">
            {DONT.map((d) => (
              <li key={d} className="flex gap-2.5 leading-7 text-brown-700">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#a24b3c]" />
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-brown-600">يخضع قبول الملابس لإرشادات الفريق عند الاستلام والفرز.</p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="section-title mb-6 text-center">أسئلة شائعة</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-sand-300/80 bg-cream-50/90 p-5 shadow-soft open:bg-cream-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-brown-800">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand-300/70 transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 leading-8 text-brown-700">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/donate" size="lg">
            <HeartHandshake /> تبرع الآن
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
