import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "Asia/Muscat";

/** Arabic date, Latin digits (clearer for phone numbers & references across devices). */
export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-OM-u-nu-latn", {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, { hour: "numeric", minute: "2-digit" });
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-OM-u-nu-latn", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("ar-OM-u-nu-latn").format(n);
}

/** Date part (YYYY-MM-DD) in Oman time. */
export function omanDateKey(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Converts "YYYY-MM-DD" + "HH:mm" entered in Oman time to an ISO timestamp (Oman is UTC+4, no DST). */
export function omanLocalToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+04:00`).toISOString();
}

export function relativeTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d);
}
