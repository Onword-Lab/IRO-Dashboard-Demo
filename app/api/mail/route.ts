import { NextResponse } from "next/server";
import { gmailConfigured, listAllThreads } from "@/lib/gmail";
import { sampleThreads } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (gmailConfigured()) {
    try {
      const threads = await listAllThreads();
      return NextResponse.json({ configured: true, threads });
    } catch (e) {
      console.error("Gmail live failed, using sample:", e);
    }
  }
  return NextResponse.json({ configured: false, threads: sampleThreads });
}
