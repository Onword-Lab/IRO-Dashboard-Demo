import { NextResponse } from "next/server";
import { listFolders, driveConfigured } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!driveConfigured()) {
    return NextResponse.json({ configured: false, folders: [] });
  }
  const parent = new URL(req.url).searchParams.get("parent") || undefined;
  try {
    const folders = await listFolders(parent);
    return NextResponse.json({ configured: true, folders });
  } catch (e: any) {
    return NextResponse.json({ configured: true, folders: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
