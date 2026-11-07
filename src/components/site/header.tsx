"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartHandshake, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "عن المبادرة" },
  { href: "/how-it-works", label: "كيف أتبرع؟" },
  { href: "/track", label: "متابعة تبرعي" },
  { href: "/contact", label: "تواصل معنا" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled ? "border-b border-sand-300/70 bg-cream-200/85 shadow-[0_6px_24px_-16px_rgb(98_69_51/0.35)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-full focus:bg-brown-800 focus:px-4 focus:py-2 focus:text-cream-50">
        انتقل إلى المحتوى
      </a>
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Logo size={66} priority />

        <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-[15px] font-medium text-brown-700 transition hover:bg-brown-800/5 hover:text-brown-900",
                isActive(item.href) && "text-brown-900 after:absolute after:inset-x-5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-rose-500",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/donate" size="md" className="hidden sm:inline-flex">
            <HeartHandshake />
            تبرع الآن
          </ButtonLink>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-brown-800 transition hover:bg-brown-800/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 z-40 origin-top bg-cream-200/98 backdrop-blur-lg transition-all duration-300 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav aria-label="قائمة الجوال" className="container-page flex flex-col gap-1 pt-4">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              aria-current={isActive(item.href) ? "page" : undefined}
              style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
              className={cn(
                "flex items-center justify-between rounded-2xl px-5 py-4 text-lg font-semibold text-brown-800 transition-all duration-300",
                open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                isActive(item.href) ? "bg-cream-50 shadow-soft" : "hover:bg-cream-50/70",
              )}
            >
              {item.label}
              {isActive(item.href) && <span className="size-2 rounded-full bg-rose-500" />}
            </Link>
          ))}
          <ButtonLink href="/donate" size="lg" className="mt-4" tabIndex={open ? 0 : -1}>
            <HeartHandshake />
            تبرع الآن
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
