import { NextResponse } from "next/server";
import { notionNodeItems, notionConfigured } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the ordered items (text + nested page/db refs) inside a Notion page
// or database — used to expand a node in the tree.
export async function GET(req: Request) {
  if (!notionConfigured()) {
    return NextResponse.json({ configured: false, items: [] });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const kind = (url.searchParams.get("kind") === "database" ? "database" : "page") as "page" | "database";
  if (!id) return NextResponse.json({ configured: true, items: [], error: "missing id" }, { status: 400 });
  try {
    const items = await notionNodeItems(id, kind);
    return NextResponse.json({ configured: true, items });
  } catch (e: any) {
    return NextResponse.json({ configured: true, items: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
