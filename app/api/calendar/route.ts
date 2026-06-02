import { NextResponse } from "next/server";
import { calendarConfigured, listUpcoming } from "@/lib/calendar";
import { sampleEvents } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (calendarConfigured()) {
    try {
      const events = await listUpcoming(14);
      return NextResponse.json({ configured: true, events });
    } catch (e) {
      console.error("Calendar live failed, using sample:", e);
    }
  }
  return NextResponse.json({ configured: false, events: sampleEvents });
}
