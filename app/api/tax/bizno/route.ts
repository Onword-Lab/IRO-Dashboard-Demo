import { NextResponse } from "next/server";
import { biznoConfigured, lookupBizNo } from "@/lib/tax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!biznoConfigured()) return NextResponse.json({ configured: false });
  const { bizNo } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ configured: true, result: await lookupBizNo(bizNo) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ configured: true, error: message }, { status: 500 });
  }
}
