import { NextResponse } from "next/server";
import { bankConfigured } from "@/lib/popbill-bank";
import { listAccounts, addAccount } from "@/lib/connections-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: bankConfigured(),
    accounts: await listAccounts(),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await addAccount(body);
  return NextResponse.json(result, { status: 201 });
}
