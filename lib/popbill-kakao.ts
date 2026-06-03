// 팝빌 카카오 알림톡 어댑터 (graceful scaffold).
// 실발송엔 ① 카카오 비즈니스 채널 등록(PlusID) + ② 승인된 알림톡 템플릿이 필요합니다.
// POPBILL_KAKAO_PLUSID 미설정 → kakaoConfigured()=false → 호출부가 안내 메시지를 반환.
// (배송/재고 알림 버튼이 이 어댑터를 사용)

const TEST_LINKID = "TESTER";
const TEST_SECRET = "SwWxqU+0TErBXy/9TVjIPEnI0VTUMMSQZtJf3Ed8q3T=";

let _lib: any = null;
function popbill(): any {
  if (_lib) return _lib;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pb = require("popbill");
  pb.config({
    LinkID: process.env.POPBILL_LINK_ID || TEST_LINKID,
    SecretKey: process.env.POPBILL_SECRET_KEY || TEST_SECRET,
    IsTest: process.env.POPBILL_IS_TEST !== "false",
    IPRestrictOnOff: false,
    UseStaticIP: false,
    UseLocalTimeYN: true,
    defaultErrorHandler: function () {},
  });
  _lib = pb;
  return pb;
}

function digits(s?: string): string { return (s || "").replace(/[^0-9]/g, ""); }
function corpNum(): string { return digits(process.env.POPBILL_CORP_NUM) || "1234567890"; }

/** 카카오 채널(PlusID) + 팝빌 키가 모두 있으면 true. */
export function kakaoConfigured(): boolean {
  return !!(process.env.POPBILL_KAKAO_PLUSID && process.env.POPBILL_LINK_ID && process.env.POPBILL_SECRET_KEY);
}

export interface AlimtalkInput {
  to: string;              // 수신 번호
  receiverName?: string;
  templateCode?: string;   // 승인된 템플릿 코드
  content: string;         // 템플릿 내용(치환 완료된 본문)
  altContent?: string;     // 대체문자(실패 시 SMS)
}

/** 알림톡 1건 발송. 성공 시 접수번호 반환. (미설정이면 throw → 호출부가 안내) */
export async function sendAlimtalk(input: AlimtalkInput): Promise<{ receiptNum: string }> {
  if (!kakaoConfigured()) {
    throw new Error("카카오 알림톡 미설정 — 팝빌 카카오 채널(PlusID)과 승인 템플릿 등록이 필요합니다.");
  }
  const svc = popbill().KakaoService();
  const corp = corpNum();
  const plusId = process.env.POPBILL_KAKAO_PLUSID as string;
  const templateCode = input.templateCode || process.env.POPBILL_KAKAO_TEMPLATE || "";
  // NOTE: 실제 연동 시 sendATS 인자 순서를 SDK 버전에 맞춰 최종 확인할 것.
  return new Promise((resolve, reject) => {
    svc.sendATS_one(
      corp, templateCode, plusId,
      input.altContent || "", input.content, "C", "",
      digits(input.to), input.receiverName || "",
      (receiptNum: any) => resolve({ receiptNum: String(receiptNum) }),
      (err: any) => reject(new Error(`[${err?.code}] ${err?.message || "알림톡 발송 실패"}`)),
    );
  });
}
