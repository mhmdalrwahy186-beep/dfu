"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  PieChart,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Bell; roles?: Role[] };

const NAV: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/donations", label: "طلبات التبرع", icon: ClipboardList },
  { href: "/admin/calendar", label: "تقويم الاستلام", icon: CalendarDays },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/volunteers", label: "المتطوعون", icon: Users, roles: ["super_admin", "admin"] },
  { href: "/admin/reports", label: "الإحصاءات والتقارير", icon: PieChart, roles: ["super_admin", "admin"] },
  { href: "/admin/quotes", label: "العبارات التحفيزية", icon: MessageSquareQuote, roles: ["super_admin", "admin"] },
  { href: "/admin/settings", label: "إعدادات الموقع", icon: Settings, roles: ["super_admin"] },
  { href: "/admin/users", label: "المشرفون والصلاحيات", icon: ShieldCheck, roles: ["super_admin"] },
];

export function AdminShell({
  children,
  user,
  unread,
  signOutAction,
}: {
  children: ReactNode;
  user: { id: string; full_name: string; role: Role };
  unread: number;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="قائمة لوحة التحكم" className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active(item.href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition",
            active(item.href) ? "bg-brown-800 text-cream-50 shadow-soft" : "text-brown-700 hover:bg-brown-800/5",
          )}
        >
          <item.icon className="size-[1.15rem]" />
          {item.label}
          {item.href === "/admin/notifications" && unread > 0 && (
            <span className="ltr-nums ms-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  const userBox = (
    <div className="mt-6 rounded-2xl border border-sand-300/80 bg-cream-100 p-3">
      <p className="truncate font-semibold text-brown-800">{user.full_name}</p>
      <p className="text-xs text-brown-600">{ROLE_LABELS[user.role]}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream-50 px-2 py-2 text-xs text-brown-700 hover:bg-sand-300/50">
          <ExternalLink className="size-3.5" /> الموقع
        </Link>
        <form action={signOutAction} className="flex-1">
          <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cream-50 px-2 py-2 text-xs text-[#8a3d30] hover:bg-[#f8e7e2]">
            <LogOut className="size-3.5" /> خروج
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col border-e border-sand-300/80 bg-cream-200 px-4 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Logo size={56} href="/admin" />
          <div>
            <p className="font-display font-extrabold text-brown-800">لوحة دفء</p>
            <p className="text-xs text-brown-600">إدارة التبرعات</p>
          </div>
        </div>
        {nav}
        {userBox}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand-300/80 bg-cream-200/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full hover:bg-brown-800/5" aria-label="فتح القائمة" aria-expanded={open}>
          <Menu className="size-6" />
        </button>
        <Logo size={44} href="/admin" />
        <NotificationBell userId={user.id} initialUnread={unread} />
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-brown-950/30 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="القائمة"
          className={cn(
            "absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-cream-200 px-4 py-5 shadow-lift transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between px-2">
            <p className="font-display text-lg font-extrabold">لوحة دفء</p>
            <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-brown-800/5" aria-label="إغلاق القائمة">
              <X className="size-5" />
            </button>
          </div>
          {nav}
          {userBox}
        </div>
      </div>

      <div className="lg:ps-72">
        <div className="hidden h-16 items-center justify-end gap-3 border-b border-sand-300/60 px-8 lg:flex">
          <NotificationBell userId={user.id} initialUnread={unread} />
        </div>
        <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-brown-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
