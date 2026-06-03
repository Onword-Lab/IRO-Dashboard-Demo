import { NextResponse } from "next/server";
import { updatePartner, deletePartner } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const p = await updatePartner(params.id, body);
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await deletePartner(params.id);
  return NextResponse.json({ ok: true });
}
