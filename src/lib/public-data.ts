import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_QUOTES } from "@/lib/quotes";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";

/** Anonymous client for public content (RLS: active quotes, public settings, aggregate stats). */
function publicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await publicClient().from("site_settings").select("key, value");
  if (error || !data) return DEFAULT_SETTINGS;
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>;
  for (const row of data) {
    if (row.key in merged && row.value && typeof row.value === "object") {
      merged[row.key] = { ...merged[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return merged as unknown as SiteSettings;
});

export const getQuotes = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured) return DEFAULT_QUOTES;
  const { data, error } = await publicClient()
    .from("motivational_quotes")
    .select("text")
    .eq("is_active", true)
    .order("sort_order");
  if (error) return DEFAULT_QUOTES;
  return (data ?? []).map((q) => q.text);
});

export type ImpactStats = {
  completed_donations: number;
  received_bags: number;
  received_pieces: number;
  pieces_recorded: number;
  received_donations: number;
};

/** Real aggregate figures, or null when they can't be loaded (never invented). */
export const getImpactStats = cache(async (): Promise<ImpactStats | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await publicClient().rpc("public_impact_stats");
  if (error || !data) return null;
  return data as ImpactStats;
});

export function socialLinks(s: SiteSettings) {
  const items: { key: string; label: string; href: string }[] = [];
  const add = (key: keyof SiteSettings["social"], label: string) => {
    const v = s.social[key]?.trim();
    if (v && /^https:\/\//.test(v)) items.push({ key, label, href: v });
  };
  add("instagram", "إنستغرام");
  add("x", "إكس");
  add("tiktok", "تيك توك");
  add("snapchat", "سناب شات");
  add("facebook", "فيسبوك");
  add("youtube", "يوتيوب");
  return items;
}
