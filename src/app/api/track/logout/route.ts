import { NextResponse } from "next/server";
import { clearTrackingSession } from "@/lib/tracking";

export async function POST() {
  await clearTrackingSession();
  return NextResponse.json({ ok: true });
}
