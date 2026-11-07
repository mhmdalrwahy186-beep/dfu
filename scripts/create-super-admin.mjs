#!/usr/bin/env node
/**
 * Creates the FIRST Super Admin account (there is no public registration).
 *
 *   node --env-file=.env.local scripts/create-super-admin.mjs <email> "<full name>"
 *
 * Sends a Supabase invitation email so the person sets their own password.
 * Add --password to set a temporary password instead of sending an email:
 *   node --env-file=.env.local scripts/create-super-admin.mjs admin@team.om "الاسم" --password
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [email, fullName, flag] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!email || !fullName) {
  console.error('Usage: node --env-file=.env.local scripts/create-super-admin.mjs <email> "<full name>" [--password]');
  process.exit(1);
}
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

let userId;
let tempPassword;
if (flag === "--password") {
  tempPassword = randomBytes(12).toString("base64url") + "9a";
  const { data, error } = await supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
  if (error) throw error;
  userId = data.user.id;
} else {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin/reset-password?welcome=1` });
  if (error) throw error;
  userId = data.user.id;
}

const { error: pErr } = await supabase
  .from("profiles")
  .upsert({ id: userId, email: email.toLowerCase(), full_name: fullName, role: "super_admin", is_active: true });
if (pErr) throw pErr;

console.log(`✔ Super Admin created: ${email}`);
if (tempPassword) {
  console.log(`  Temporary password: ${tempPassword}`);
  console.log("  Sign in at /admin/login and change it immediately (use «نسيت كلمة المرور؟»).");
} else {
  console.log("  An invitation email was sent. Make sure the Invite email template is configured (see DEPLOYMENT.md).");
}
