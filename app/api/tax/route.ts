import { NextResponse } from "next/server";
import { taxConfigured } from "@/lib/tax";
import { sampleInvoices } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 받은 내역(매입) — 홈택스 자동수집 자리. 지금은 sample(purchase) 반환,
// 추후 Popbill 홈택스수집 API로 교체.
export async function GET() {
  const received = sampleInvoices.filter((i) => i.type === "purchase");
  return NextResponse.json({ configured: taxConfigured(), received });
}
