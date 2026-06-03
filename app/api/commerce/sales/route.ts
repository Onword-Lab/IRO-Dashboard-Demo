import { NextResponse } from "next/server";
import { commerceConfigured, listSales } from "@/lib/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: commerceConfigured(), sales: await listSales() });
}
