import { NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/tax-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ profile: await getProfile() });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ profile: await saveProfile(body) });
}
