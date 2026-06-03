import { NextResponse } from "next/server";
import { listPartners, createPartner } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listPartners());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const partner = await createPartner(body);
  return NextResponse.json(partner, { status: 201 });
}
