import { NextResponse } from "next/server";
import { listTransactions, createTransaction } from "@/lib/finance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listTransactions());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const tx = await createTransaction(body);
  return NextResponse.json(tx, { status: 201 });
}
