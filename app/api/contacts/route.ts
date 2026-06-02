import { NextResponse } from "next/server";
import { listContacts, createContact } from "@/lib/contacts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listContacts());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const contact = await createContact(body);
  return NextResponse.json(contact, { status: 201 });
}
