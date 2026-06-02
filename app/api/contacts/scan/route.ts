import { NextResponse } from "next/server";
import { ocrConfigured, readCard, parseCard } from "@/lib/ocr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ocrConfigured()) return NextResponse.json({ configured: false });
  const { imageBase64 } = await req.json().catch(() => ({}));
  try {
    const text = await readCard(imageBase64);
    return NextResponse.json({ configured: true, fields: parseCard(text), text });
  } catch (e: any) {
    return NextResponse.json(
      { configured: true, error: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
