import { NextResponse } from "next/server";
import { commerceConfigured, listShipping } from "@/lib/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: commerceConfigured(), shipping: await listShipping() });
}
