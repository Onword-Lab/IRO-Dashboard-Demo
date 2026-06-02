import { NextResponse } from "next/server";
import { listInvoices, createInvoice } from "@/lib/tax-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ invoices: await listInvoices() });
}

// 정발행 — issue a 세금계산서 (test mode → stored locally)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const invoice = await createInvoice(body);
  return NextResponse.json(invoice, { status: 201 });
}
