import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SectionHeading } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { formatOmaniPhone } from "@/lib/phone";
import { getSettings, socialLinks } from "@/lib/public-data";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "تواصل معنا", description: "وسائل التواصل مع فريق دفء التطوعي." };
export const revalidate = 300;

export default async function ContactPage() {
  const settings = await getSettings();
  const { contact } = settings;
  const social = socialLinks(settings);
  const wa = whatsappLink(contact.whatsapp, "السلام عليكم، لدي استفسار بخصوص التبرع بالملابس.");
  const tel = telLink(contact.phone);

  const cards = [
    tel && { icon: Phone, title: "اتصل بنا", value: formatOmaniPhone(contact.phone), href: tel, ltr: true },
    wa && { icon: MessageCircle, title: "واتساب", value: formatOmaniPhone(contact.whatsapp), href: wa, ltr: true, external: true },
    contact.email && { icon: Mail, title: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, ltr: true },
    contact.address && { icon: MapPin, title: "العنوان", value: contact.address },
    contact.hours && { icon: Clock, title: "أوقات التواصل", value: contact.hours },
  ].filter(Boolean) as { icon: typeof Phone; title: string; value: string; href?: string; ltr?: boolean; external?: boolean }[];

  return (
    <div className="container-page max-w-4xl pt-6 sm:pt-10">
      <SectionHeading eyebrow="يسعدنا تواصلك" title="تواصل معنا" description="لأي استفسار عن التبرع أو التطوع مع الفريق." />

      {cards.length === 0 && social.length === 0 ? (
        <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 shadow-soft">
          <EmptyState
            icon={<MessageCircle />}
            title="ستُضاف وسائل التواصل قريبًا"
            description="يعمل الفريق على إضافة وسائل التواصل الرسمية. يمكنك في الأثناء تسجيل تبرعك وسيتواصل معك الفريق مباشرة."
            action={<ButtonLink href="/donate">تبرع الآن</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((c) => {
              const inner = (
                <>
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-200/70 text-rose-600">
                    <c.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-brown-600">{c.title}</span>
                    <span className={`block text-lg font-bold text-brown-800 ${c.ltr ? "ltr-nums" : ""}`}>{c.value}</span>
                  </span>
                </>
              );
              const cls = "flex items-center gap-4 rounded-3xl border border-sand-300/80 bg-cream-50/90 p-5 shadow-soft transition";
              return c.href ? (
                <a key={c.title} href={c.href} className={`${cls} hover:-translate-y-0.5 hover:shadow-lift`} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {inner}
                </a>
              ) : (
                <div key={c.title} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
          {social.length > 0 && (
            <div className="mt-10 text-center">
              <h2 className="mb-4 text-lg font-bold">تابعنا</h2>
              <ul className="flex flex-wrap justify-center gap-3">
                {social.map((s) => (
                  <li key={s.key}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-sand-400/70 bg-cream-50 px-5 py-2 font-medium text-brown-700 shadow-soft transition hover:border-rose-400 hover:text-rose-600">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
