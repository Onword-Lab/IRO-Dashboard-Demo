// 팝빌 계좌/카드 연동 어댑터 — 100% mock (네트워크 호출 없음).
// 추후 EasyFinBankService.registBankAccount / requestJob / search 로 교체.
//
// 실연동 시 교체 포인트:
//   bankConfigured() → POPBILL_LINK_ID + POPBILL_SECRET_KEY + POPBILL_CORP_NUM 존재 여부 체크
//   mockTxnsFor()    → EasyFinBankService.search(corpNum, bankCode, accountNum, ...) 결과 매핑
import { randomUUID } from "crypto";
import type { BankAccount, BankTxn } from "./types";

/** 실연동 전: 팝빌 EasyFinBankService 미연결이므로 항상 false. */
export function bankConfigured(): boolean {
  // 추후: return !!(process.env.POPBILL_LINK_ID && process.env.POPBILL_SECRET_KEY && process.env.POPBILL_CORP_NUM);
  return false;
}

// ── Mock txn generator ────────────────────────────────────────────────────────

const IN_COUNTERPARTIES = ["안녕 Education", "Vive", "그린마트", "교내 AI Club"];
const OUT_COUNTERPARTIES = ["AWS", "Google Cloud", "배달의민족"];

// Fixed date strings within ~2 weeks of 2026-06-02 (hardcoded for stability)
const BANK_IN_DATES  = ["2026-05-20", "2026-05-27", "2026-06-01"];
const BANK_OUT_DATES = ["2026-05-22", "2026-05-29", "2026-06-02"];
const CARD_OUT_DATES = ["2026-05-21", "2026-05-28", "2026-06-02"];

const BANK_IN_AMOUNTS  = [1200000, 2200000, 880000];
const BANK_OUT_AMOUNTS = [142000, 99000, 38000];
const CARD_OUT_AMOUNTS = [55000, 148000, 32000];

/**
 * 새로 등록된 계좌/카드에 대해 그럴듯한 mock 거래내역 3건을 생성한다.
 * 은행 계좌: 입금 2건 + 출금 1건 / 카드: 출금 3건.
 */
export function mockTxnsFor(account: BankAccount): BankTxn[] {
  if (account.kind === "bank") {
    return [
      {
        id: randomUUID(),
        accountId: account.id,
        date: BANK_IN_DATES[0],
        direction: "in",
        counterparty: IN_COUNTERPARTIES[0],
        amount: BANK_IN_AMOUNTS[0],
        source: "bank",
      },
      {
        id: randomUUID(),
        accountId: account.id,
        date: BANK_IN_DATES[1],
        direction: "in",
        counterparty: IN_COUNTERPARTIES[2],
        amount: BANK_IN_AMOUNTS[1],
        source: "bank",
      },
      {
        id: randomUUID(),
        accountId: account.id,
        date: BANK_OUT_DATES[1],
        direction: "out",
        counterparty: OUT_COUNTERPARTIES[1],
        amount: BANK_OUT_AMOUNTS[1],
        source: "bank",
      },
    ];
  }

  // card: 출금 위주
  return [
    {
      id: randomUUID(),
      accountId: account.id,
      date: CARD_OUT_DATES[0],
      direction: "out",
      counterparty: OUT_COUNTERPARTIES[0],
      amount: CARD_OUT_AMOUNTS[0],
      source: "card",
    },
    {
      id: randomUUID(),
      accountId: account.id,
      date: CARD_OUT_DATES[1],
      direction: "out",
      counterparty: OUT_COUNTERPARTIES[2],
      amount: CARD_OUT_AMOUNTS[1],
      source: "card",
    },
    {
      id: randomUUID(),
      accountId: account.id,
      date: CARD_OUT_DATES[2],
      direction: "out",
      counterparty: OUT_COUNTERPARTIES[1],
      amount: CARD_OUT_AMOUNTS[2],
      source: "card",
    },
  ];
}
