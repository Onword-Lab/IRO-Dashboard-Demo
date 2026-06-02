import type { TaxInvoice } from "./types";
import { popbillOwnCreds } from "./popbill";

/** True when the user's OWN Popbill credentials are set (vs the shared TESTER sandbox). */
export function taxConfigured(): boolean {
  return popbillOwnCreds();
}

/**
 * Fetch live e-tax-invoices via Popbill relay.
 * TODO: Popbill integration — implement once POPBILL_LINK_KEY is provisioned.
 */
export async function listInvoices(): Promise<TaxInvoice[]> {
  return [];
}

/** Returns true when a data.go.kr service key is present. */
export function biznoConfigured(): boolean {
  return !!process.env.DATA_GO_KR_KEY;
}

/** Look up 사업자번호 status via the National Tax Service open API. */
export async function lookupBizNo(
  bizNo: string
): Promise<{ bizNo: string; status: string; taxType?: string }> {
  if (!biznoConfigured()) {
    throw new Error("bizno lookup not configured");
  }

  const cleaned = bizNo.replace(/[^0-9]/g, "");
  const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(
    process.env.DATA_GO_KR_KEY!
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b_no: [cleaned] }),
  });

  if (!res.ok) {
    throw new Error(`NTS API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const row = json.data?.[0];

  const status: string = row?.b_stt ?? "조회불가";
  const taxType: string | undefined = row?.tax_type;

  return { bizNo: cleaned, status, taxType };
}
