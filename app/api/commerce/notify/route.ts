import { NextResponse } from "next/server";
import { kakaoConfigured, sendAlimtalk } from "@/lib/popbill-kakao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { to, name?, content, templateCode? } → 카카오 알림톡 발송 (배송/재고 알림)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  if (!kakaoConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "카카오 알림톡 연동 설정이 필요합니다 — 팝빌에서 카카오 채널(PlusID) + 승인 템플릿 등록 후 POPBILL_KAKAO_PLUSID 설정.",
    });
  }
  try {
    const r = await sendAlimtalk({ to: body.to, receiverName: body.name, content: body.content, templateCode: body.templateCode });
    return NextResponse.json({ configured: true, sent: true, receiptNum: r.receiptNum });
  } catch (e) {
    return NextResponse.json({ configured: true, sent: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
