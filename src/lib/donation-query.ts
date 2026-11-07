import { DONATION_STATUSES, type DonationStatus } from "@/lib/constants";
import { GOVERNORATE_NAMES } from "@/lib/oman";

export const PAGE_SIZE = 20;
export const SORTABLE = ["created_at", "reference", "donor_name", "governorate", "status"] as const;
export type SortKey = (typeof SORTABLE)[number];

export type DonationFilters = {
  q: string;
  status: DonationStatus | "open" | "";
  governorate: string;
  from: string;
  to: string;
  sort: SortKey;
  dir: "asc" | "desc";
  page: number;
};

const OPEN_STATUSES: DonationStatus[] = ["new", "reviewed", "contacting", "scheduled", "awaiting_pickup"];
const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Parses and whitelists list filters from the URL (never trusts raw input in queries). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): DonationFilters {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? "";
  const status = get("status");
  const sort = get("sort") as SortKey;
  return {
    // Characters with meaning in PostgREST filter syntax are stripped.
    q: get("q").replace(/[,()*%\\:"']/g, " ").trim().slice(0, 60),
    status: status === "open" || (DONATION_STATUSES as readonly string[]).includes(status) ? (status as DonationFilters["status"]) : "",
    governorate: GOVERNORATE_NAMES.includes(get("governorate")) ? get("governorate") : "",
    from: isDate(get("from")) ? get("from") : "",
    to: isDate(get("to")) ? get("to") : "",
    sort: SORTABLE.includes(sort) ? sort : "created_at",
    dir: get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.min(10000, Number.parseInt(get("page"), 10) || 1)),
  };
}

// Minimal structural type so this works with the Supabase query builder without importing its generics.
type Filterable<T> = {
  or(f: string): T;
  eq(c: string, v: string): T;
  in(c: string, v: string[]): T;
  gte(c: string, v: string): T;
  lt(c: string, v: string): T;
};

export function applyFilters<T extends Filterable<T>>(query: T, f: DonationFilters): T {
  let q = query;
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    const parts = [`reference.ilike.*${f.q}*`, `donor_name.ilike.*${f.q}*`];
    if (digits.length >= 3) parts.push(`phone.ilike.*${digits}*`);
    q = q.or(parts.join(","));
  }
  if (f.status === "open") q = q.in("status", OPEN_STATUSES);
  else if (f.status) q = q.eq("status", f.status);
  if (f.governorate) q = q.eq("governorate", f.governorate);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00+04:00`);
  if (f.to) {
    const end = new Date(`${f.to}T00:00:00+04:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    q = q.lt("created_at", end.toISOString());
  }
  return q;
}

export function filtersToSearch(f: Partial<DonationFilters>, overrides: Partial<DonationFilters> & { format?: string } = {}) {
  const merged = { ...f, ...overrides };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === "" || v === undefined || v === null) continue;
    if (k === "page" && v === 1) continue;
    if (k === "sort" && v === "created_at") continue;
    if (k === "dir" && v === "desc") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
