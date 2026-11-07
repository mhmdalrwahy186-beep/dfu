import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { HeartDivider } from "@/components/ui/misc";
import { formatOmaniPhone } from "@/lib/phone";
import { getSettings, socialLinks } from "@/lib/public-data";

export async function SiteFooter() {
  const settings = await getSettings();
  const social = socialLinks(settings);
  const { contact } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-sand-300/80 bg-cream-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={120} />
          <p className="mt-4 font-display text-xl font-bold text-brown-800">{settings.team.name}</p>
          <p className="mt-1 text-brown-600">«{settings.team.tagline}»</p>
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold">روابط</h2>
          <ul className="space-y-2.5 text-[15px] text-brown-700">
            <li><Link className="hover:text-rose-600" href="/donate">تبرع الآن</Link></li>
            <li><Link className="hover:text-rose-600" href="/how-it-works">كيف أتبرع؟</Link></li>
            <li><Link className="hover:text-rose-600" href="/track">متابعة تبرعي</Link></li>
            <li><Link className="hover:text-rose-600" href="/contact">تواصل معنا</Link></li>
            <li><Link className="hover:text-rose-600" href="/privacy">سياسة الخصوصية</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold">تواصل معنا</h2>
          <ul className="space-y-2.5 text-[15px] text-brown-700">
            {contact.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-rose-500" />
                <a className="ltr-nums hover:text-rose-600" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  {formatOmaniPhone(contact.phone)}
                </a>
              </li>
            )}
            {contact.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-rose-500" />
                <a className="hover:text-rose-600" href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-rose-500" />
                {contact.address}
              </li>
            )}
            {!contact.phone && !contact.email && !contact.address && (
              <li className="text-brown-600">
                <Link className="underline decoration-rose-300 underline-offset-4 hover:text-rose-600" href="/contact">صفحة التواصل</Link>
              </li>
            )}
          </ul>
          {social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="حساباتنا على وسائل التواصل">
              {social.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-sand-400/70 bg-cream-50 px-3.5 py-1.5 text-sm text-brown-700 transition hover:border-rose-400 hover:text-rose-600"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-sand-300/70">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-brown-600 sm:flex-row">
          <p>© {year} {settings.team.name}. جميع الحقوق محفوظة.</p>
          <HeartDivider className="hidden sm:flex [&>span:first-child]:w-8 [&>span:last-child]:w-8" />
          <p>دفءٌ منك… وأثرٌ يبقى 🤎</p>
        </div>
      </div>
    </footer>
  );
}
