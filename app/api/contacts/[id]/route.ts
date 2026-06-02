import { NextResponse } from "next/server";
import { getContact, updateContact, deleteContact } from "@/lib/contacts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const c = await getContact(params.id);
  return c ? NextResponse.json(c) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const c = await updateContact(params.id, body);
  return c ? NextResponse.json(c) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = await deleteContact(params.id);
  return NextResponse.json({ ok });
}
