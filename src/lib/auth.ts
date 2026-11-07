import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";

export type StaffProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
};

/** The signed-in, active staff member — verified with Supabase Auth on every request. */
export const getStaff = cache(async (): Promise<StaffProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return data as StaffProfile;
});

/** For pages: redirects when not signed in or not allowed. */
export async function requireStaff(roles?: Role[]) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (roles && !roles.includes(staff.role)) redirect("/admin?denied=1");
  return staff;
}

/** For server actions / route handlers: returns null instead of redirecting. */
export async function authorize(roles?: Role[]) {
  const staff = await getStaff();
  if (!staff) return null;
  if (roles && !roles.includes(staff.role)) return null;
  return staff;
}

export const ADMIN_ROLES: Role[] = ["super_admin", "admin"];
export const isAdminRole = (r: Role) => r === "admin" || r === "super_admin";
