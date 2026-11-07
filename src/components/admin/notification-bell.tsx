"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Unread counter that updates live through Supabase Realtime (RLS ensures each
 * staff member only receives their own notifications).
 */
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [pulse, setPulse] = useState(false);
  const router = useRouter();

  useEffect(() => setUnread(initialUnread), [initialUnread]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => {
          setUnread((n) => n + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return (
    <Link
      href="/admin/notifications"
      className="relative grid size-10 place-items-center rounded-full text-brown-700 transition hover:bg-brown-800/5"
      aria-label={unread > 0 ? `الإشعارات: ${unread} غير مقروءة` : "الإشعارات"}
    >
      <Bell className={pulse ? "size-5 animate-bounce" : "size-5"} />
      {unread > 0 && (
        <span className="ltr-nums absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-cream-200">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
