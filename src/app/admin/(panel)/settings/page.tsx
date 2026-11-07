import type { Metadata } from "next";
import { SettingsForms } from "@/components/admin/settings-forms";
import { PageHeader } from "@/components/admin/shell";
import { requireStaff } from "@/lib/auth";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "إعدادات الموقع" };

export default async function SettingsPage() {
  await requireStaff(["super_admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const settings = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>;
  for (const row of data ?? []) if (row.key in settings) settings[row.key] = { ...settings[row.key], ...(row.value as Record<string, unknown>) };

  return (
    <>
      <PageHeader title="إعدادات الموقع" description="المحتوى الذي يظهر للزوار. تظهر التغييرات في الموقع خلال دقائق." />
      <SettingsForms initial={settings as unknown as SiteSettings} />
    </>
  );
}
