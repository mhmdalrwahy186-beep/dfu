#!/usr/bin/env node
/**
 * Data retention job: anonymizes personal data of donations that have been
 * completed or cancelled for longer than RETENTION_DAYS (default 365, minimum 30),
 * and deletes their photos from Storage. Aggregate statistics are preserved.
 *
 *   node --env-file=.env.local scripts/run-retention.mjs           # do it
 *   node --env-file=.env.local scripts/run-retention.mjs --dry-run # list only
 *
 * Run it on a schedule (e.g. monthly) — see DEPLOYMENT.md.
 */
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const days = Math.max(30, Number(process.env.RETENTION_DAYS) || 365);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: ids, error } = await supabase.rpc("donations_due_for_anonymization", { p_days: days });
if (error) throw error;
console.log(`${ids.length} donation(s) closed for more than ${days} days.`);
if (dryRun || ids.length === 0) process.exit(0);

let done = 0;
for (const id of ids) {
  const { data: paths, error: e } = await supabase.rpc("anonymize_donation", { p_donation: id });
  if (e) {
    console.error(`✘ ${id}: ${e.message}`);
    continue;
  }
  if (paths?.length) {
    const { error: se } = await supabase.storage.from("donation-images").remove(paths);
    if (se) console.error(`  photos of ${id} not deleted: ${se.message}`);
  }
  done++;
}
console.log(`✔ Anonymized ${done} donation(s).`);
