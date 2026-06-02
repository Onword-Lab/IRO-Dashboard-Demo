// Popbill 연동 어댑터 (테스트/샌드박스 기본).
//  • POPBILL_LINK_ID / POPBILL_SECRET_KEY 미설정 → 공개 TESTER 샌드박스로 동작.
//  • 본인 키 설정 → 자동으로 본인 계정 테스트베드 사용.
//  • POPBILL_IS_TEST=false → 운영(실제 국세청 전송).
// 실호출이 실패하면 호출부(lib/tax-store.ts)가 로컬 저장으로 graceful fallback 한다.
// SDK는 lazy require — 실제 발행이 일어날 때만 로드된다(번들에서 external 처리).
import type { TaxInvoice, CashReceipt, IssuerProfile } from "./types";

// 팝빌 공식 튜토리얼의 공개 테스트베드 자격증명
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
    IsTest: process.env.POPBILL_IS_TEST !== "false", // 기본 true
    IPRestrictOnOff: false,
    UseStaticIP: false,
    UseLocalTimeYN: true,
    defaultErrorHandler: function () {},
  });
  _lib = pb;
  return pb;
}

/** 본인(가입) 자격증명이 설정돼 있으면 true (아니면 공개 TESTER 샌드박스). */
export function popbillOwnCreds(): boolean {
  return !!(process.env.POPBILL_LINK_ID && process.env.POPBILL_SECRET_KEY);
}
/** POPBILL_OFF=true 로 완전히 끌 수 있음. 기본은 켜짐(테스트). */
export function popbillEnabled(): boolean {
  return process.env.POPBILL_OFF !== "true";
}

function digits(s?: string): string { return (s || "").replace(/[^0-9]/g, ""); }
function ymd(dateStr?: string): string {
  if (dateStr) { const d = dateStr.replace(/[^0-9]/g, ""); if (d.length >= 8) return d.slice(0, 8); }
  const d = new Date(); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
function ymdhms(): string {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function uniqueMgtKey(): string {
  return "IRO" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
/** 팝빌 회원(발행 주체) 사업자번호. 본인 키면 프로필 번호, 아니면 테스트 번호. */
function memberCorpNum(profile?: IssuerProfile): string {
  if (process.env.POPBILL_CORP_NUM) return digits(process.env.POPBILL_CORP_NUM);
  if (popbillOwnCreds()) { const n = digits(profile?.bizNo); if (n.length === 10) return n; }
  return "1234567890"; // 팝빌 테스트 회원 번호
}

/** 세금계산서 정발행 (즉시발행). 성공 시 국세청 승인번호 반환. */
export async function issueTaxInvoice(
  inv: TaxInvoice, profile: IssuerProfile,
): Promise<{ ntsConfirmNum?: string; mgtKey: string }> {
  const svc = popbill().TaxinvoiceService();
  const corp = memberCorpNum(profile);
  const mgtKey = uniqueMgtKey();
  const taxinvoice = {
    writeDate: ymd(inv.issueDate),
    chargeDirection: "정과금",
    issueType: "정발행",
    purposeType: inv.receiveType || "청구",
    taxType: inv.taxType || "과세",
    invoicerCorpNum: corp,
    invoicerMgtKey: mgtKey,
    invoicerCorpName: profile.corpName || "테스트공급자",
    invoicerCEOName: profile.ceoName || "대표자",
    invoicerAddr: profile.address || "",
    invoicerBizType: profile.bizType || "",
    invoicerBizClass: profile.bizItem || "",
    invoicerContactName: profile.ceoName || "담당자",
    invoicerEmail: profile.email || "",
    invoiceeType: "사업자",
    invoiceeCorpNum: digits(inv.partnerBizNo) || "8888888888",
    invoiceeCorpName: inv.partnerName || "공급받는자",
    invoiceeCEOName: inv.partnerCeo || "대표자",
    invoiceeContactName1: inv.partnerCeo || "담당자",
    invoiceeEmail1: inv.partnerEmail || "",
    supplyCostTotal: String(inv.supplyAmount),
    taxTotal: String(inv.vat),
    totalAmount: String(inv.total),
    detailList: (inv.items || []).map((it, i) => ({
      serialNum: i + 1,
      itemName: it.name,
      qty: String(it.qty),
      unitCost: String(it.unitPrice),
      supplyCost: String(it.supplyAmount),
      tax: String(it.vat),
    })),
  };
  return new Promise((resolve, reject) => {
    svc.registIssue(
      corp, taxinvoice,
      (result: any) => resolve({ ntsConfirmNum: result?.ntsConfirmNum, mgtKey }),
      (err: any) => reject(new Error(`[${err?.code}] ${err?.message || "Popbill 세금계산서 발행 실패"}`)),
    );
  });
}

/** 현금영수증 발행. 성공 시 국세청 승인번호 반환. */
export async function issueCashbill(
  cr: CashReceipt, profile: IssuerProfile,
): Promise<{ ntsConfirmNum?: string; mgtKey: string }> {
  const svc = popbill().CashbillService();
  const corp = memberCorpNum(profile);
  const mgtKey = uniqueMgtKey();
  const cashbill = {
    mgtKey,
    tradeDT: ymdhms(),
    tradeType: "승인거래",
    tradeUsage: cr.purpose === "소득공제" ? "소득공제용" : "지출증빙용",
    taxationType: "과세",
    identityNum: digits(cr.identityNum) || "0100000000",
    supplyCost: String(cr.supplyAmount),
    tax: String(cr.vat),
    serviceFee: "0",
    totalAmount: String(cr.total),
    franchiseCorpNum: corp,
    franchiseCorpName: profile.corpName || "테스트가맹점",
    franchiseCEOName: profile.ceoName || "대표자",
    franchiseAddr: profile.address || "",
    franchiseTEL: "",
    itemName: "상품",
  };
  return new Promise((resolve, reject) => {
    svc.registIssue(
      corp, cashbill,
      (result: any) => resolve({ ntsConfirmNum: result?.confirmNum || result?.ntsConfirmNum, mgtKey }),
      (err: any) => reject(new Error(`[${err?.code}] ${err?.message || "Popbill 현금영수증 발행 실패"}`)),
    );
  });
}
