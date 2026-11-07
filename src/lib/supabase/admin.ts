import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import { serviceRoleKey } from "@/lib/server-env";

/**
 * Service-role client: bypasses RLS. Server-only, used for
 * - validated public donation submissions,
 * - donor tracking after OTP verification,
 * - uploading private photos and creating signed URLs,
 * - inviting staff (Auth admin API).
 * Every caller must perform its own validation/authorization first.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const DONATION_BUCKET = "donation-images";
