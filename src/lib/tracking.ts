import "server-only";
import { cookies } from "next/headers";
import { DONOR_TIMELINE, type DonationStatus } from "@/lib/constants";
import { signToken, verifyToken } from "@/lib/security";
import { isServiceConfigured } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

export const TRACK_COOKIE = "daff_track";
export const TRACK_SESSION_SECONDS = 30 * 60;
export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;

export function normalizeReference(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function isReferenceFormat(ref: string) {
  return /^DF-\d{2}-\d{5,}$/.test(ref);
}

export async function setTrackingSession(donationId: string) {
  const store = await cookies();
  store.set(TRACK_COOKIE, signToken({ did: donationId }, TRACK_SESSION_SECONDS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRACK_SESSION_SECONDS,
  });
}

export async function clearTrackingSession() {
  (await cookies()).delete(TRACK_COOKIE);
}

export type DonorView = {
  reference: string;
  created_at: string;
  status: DonationStatus;
  governorate: string;
  wilayat: string;
  categories: string[];
  quantity_option: string;
  quantity_other: string | null;
  appointment: { scheduled_at: string; duration_minutes: number } | null;
  timeline: { status: DonationStatus; reached: boolean; at: string | null; current: boolean }[];
};

/**
 * Loads the donor-safe view of the donation in the verified tracking session.
 * Only explicitly selected, non-internal fields are returned (no notes, no staff names).
 */
export async function getTrackedDonation(): Promise<DonorView | null> {
  if (!isServiceConfigured()) return null;
  const token = (await cookies()).get(TRACK_COOKIE)?.value;
  let session: { did: string } | null = null;
  try {
    session = verifyToken<{ did: string }>(token);
  } catch {
    return null;
  }
  if (!session?.did) return null;

  const supabase = createAdminClient();
  const { data: d } = await supabase
    .from("donations")
    .select("id, reference, created_at, status, governorate, wilayat, quantity_option, quantity_other, anonymized_at, donation_items(category)")
    .eq("id", session.did)
    .maybeSingle();
  if (!d || d.anonymized_at) return null;

  const [{ data: history }, { data: appt }] = await Promise.all([
    supabase.from("donation_status_history").select("to_status, created_at").eq("donation_id", d.id).order("created_at"),
    supabase
      .from("collection_appointments")
      .select("scheduled_at, duration_minutes")
      .eq("donation_id", d.id)
      .eq("status", "scheduled")
      .maybeSingle(),
  ]);

  const status = d.status as DonationStatus;
  const firstAt = new Map<string, string>();
  for (const h of history ?? []) if (!firstAt.has(h.to_status)) firstAt.set(h.to_status, h.created_at);
  const currentIndex = DONOR_TIMELINE.indexOf(status);

  return {
    reference: d.reference,
    created_at: d.created_at,
    status,
    governorate: d.governorate,
    wilayat: d.wilayat,
    categories: (d.donation_items as { category: string }[] | null)?.map((i) => i.category) ?? [],
    quantity_option: d.quantity_option,
    quantity_other: d.quantity_other,
    appointment: appt ?? null,
    timeline: DONOR_TIMELINE.map((s, i) => ({
      status: s,
      reached: status !== "cancelled" ? i <= currentIndex : firstAt.has(s),
      current: s === status,
      at: firstAt.get(s) ?? null,
    })),
  };
}
