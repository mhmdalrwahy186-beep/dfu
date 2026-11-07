import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles links from Supabase Auth emails (staff invitations and password resets).
 * The email templates must point here — see DEPLOYMENT.md:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const allowed: EmailOtpType[] = ["invite", "recovery", "email", "magiclink"];

  if (tokenHash && type && allowed.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const dest = type === "invite" ? "/admin/reset-password?welcome=1" : type === "recovery" ? "/admin/reset-password" : "/admin";
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
