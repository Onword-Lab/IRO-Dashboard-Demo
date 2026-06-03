import { NextResponse } from "next/server";
import { bankConfigured } from "@/lib/popbill-bank";
import { listTxns } from "@/lib/connections-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: bankConfigured(),
    txns: await listTxns(),
  });
}
