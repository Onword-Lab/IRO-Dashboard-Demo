import { NextResponse } from "next/server";
import { parseBankCsv } from "@/lib/csv";
import { createMany } from "@/lib/finance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const csv: string = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "No CSV content provided." }, { status: 400 });
  }
  const inputs = parseBankCsv(csv);
  if (inputs.length === 0) {
    return NextResponse.json({ error: "No valid rows parsed from CSV." }, { status: 422 });
  }
  const created = await createMany(inputs);
  return NextResponse.json({ created }, { status: 201 });
}
