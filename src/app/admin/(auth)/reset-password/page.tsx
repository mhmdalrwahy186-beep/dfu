import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "../auth-forms";

export const dynamic = "force-dynamic";

/** Reached after /auth/confirm verified an invite or recovery link (the user is signed in). */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=link");
  const { welcome } = await searchParams;
  return <NewPasswordForm welcome={welcome === "1"} />;
}
