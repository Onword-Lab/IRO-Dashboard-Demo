import { NextResponse } from "next/server";
import { commerceConfigured, listOrders } from "@/lib/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: commerceConfigured(), orders: await listOrders() });
}
