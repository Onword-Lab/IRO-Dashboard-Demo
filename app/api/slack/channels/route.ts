import { NextResponse } from "next/server";
import { slackConfigured, listChannels } from "@/lib/slack";
import { sampleChannels } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (slackConfigured()) {
    try {
      const channels = await listChannels();
      return NextResponse.json({ configured: true, channels });
    } catch (e) {
      console.error("Slack channels failed, using sample:", e);
    }
  }
  return NextResponse.json({ configured: false, channels: sampleChannels });
}
