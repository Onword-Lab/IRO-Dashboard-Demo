import { NextResponse } from "next/server";
import { listCashReceipts, createCashReceipt } from "@/lib/tax-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ cashReceipts: await listCashReceipts() });
}

// 현금영수증 발행 (test mode → stored locally)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const receipt = await createCashReceipt(body);
  return NextResponse.json(receipt, { status: 201 });
}
