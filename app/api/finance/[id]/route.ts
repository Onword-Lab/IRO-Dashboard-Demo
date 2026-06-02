import { NextResponse } from "next/server";
import { getTransactionById, updateTransaction, deleteTransaction } from "@/lib/finance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const t = await getTransactionById(params.id);
  return t ? NextResponse.json(t) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const t = await updateTransaction(params.id, body);
  return t ? NextResponse.json(t) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = await deleteTransaction(params.id);
  return NextResponse.json({ ok });
}
