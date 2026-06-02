import { NextResponse } from "next/server";
import { searchNotion, notionConfigured } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!notionConfigured()) {
    return NextResponse.json({ configured: false, results: [] });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await searchNotion(q);
    return NextResponse.json({ configured: true, results });
  } catch (e: any) {
    return NextResponse.json({ configured: true, results: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
