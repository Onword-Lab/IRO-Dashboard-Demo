import { NextResponse } from "next/server";
import { listInvoices, createInvoice } from "@/lib/tax-store";
import { markIssued } from "@/lib/connections-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ invoices: await listInvoices() });
}

// 정발행 — issue a 세금계산서. 거래내역에서 온 경우(sourceTxnIds) 해당 거래에 "발행됨" 스탬프.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const invoice = await createInvoice(body);
  const ids: string[] = Array.isArray(body?.sourceTxnIds) ? body.sourceTxnIds : [];
  if (ids.length) {
    try { await markIssued(ids, invoice.id); } catch (e) { console.error("markIssued failed:", e); }
  }
  return NextResponse.json(invoice, { status: 201 });
}
