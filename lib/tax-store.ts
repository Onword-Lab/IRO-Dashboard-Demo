// ── Tax store (dashboard-owned, TEST MODE) ───────────────────────────────────
// Holds the issuer profile, issued 세금계산서(매출), and 현금영수증 in a local JSON
// file so the self-service console fully works before Popbill is connected.
// Backend swap plan: NOW .data/tax.json → LATER Popbill API (lib/tax.ts) + Supabase.
// All access goes through this module so the swap is a single-file change.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { TaxInvoice, TaxItem, CashReceipt, CashReceiptPurpose, IssuerProfile } from "./types";
import { sampleInvoices, sampleCashReceipts, sampleIssuerProfile } from "./seed";
import { popbillEnabled, issueTaxInvoice, issueCashbill } from "./popbill";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "tax.json");

interface TaxData {
  profile: IssuerProfile;
  invoices: TaxInvoice[]; // 매출 (issued by us)
  cashReceipts: CashReceipt[];
}

async function writeData(d: TaxData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(d, null, 2), "utf8");
}

async function readData(): Promise<TaxData> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const d = JSON.parse(txt);
    return {
      profile: d.profile ?? { ...sampleIssuerProfile },
      invoices: Array.isArray(d.invoices) ? d.invoices : [],
      cashReceipts: Array.isArray(d.cashReceipts) ? d.cashReceipts : [],
    };
  } catch {
    // Seed on first run so the console isn't empty.
    const seeded: TaxData = {
      profile: { ...sampleIssuerProfile },
      invoices: sampleInvoices.filter((i) => i.type === "sales"),
      cashReceipts: [...sampleCashReceipts],
    };
    await writeData(seeded);
    return seeded;
  }
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function today() { return new Date().toISOString().slice(0, 10); }
function mockConfirmNum(prefix: string) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.floor(Math.random() * 1e8).toString().padStart(8, "0");
  return `${prefix}${ymd}-${rand}`;
}

// ── Profile (내 사업자 정보) ──
export async function getProfile(): Promise<IssuerProfile> {
  return (await readData()).profile;
}
export async function saveProfile(patch: Partial<IssuerProfile>): Promise<IssuerProfile> {
  const d = await readData();
  d.profile = { ...d.profile, ...patch, updatedAt: new Date().toISOString() };
  await writeData(d);
  return d.profile;
}

// ── 세금계산서 정발행 (매출) ──
export interface InvoiceInput {
  issueDate?: string;
  partnerName?: string;
  partnerBizNo?: string;
  partnerCeo?: string;
  partnerEmail?: string;
  items?: { name: string; qty: number; unitPrice: number }[];
  taxType?: "과세" | "영세" | "면세";
  receiveType?: "영수" | "청구";
}
export async function listInvoices(): Promise<TaxInvoice[]> {
  const d = await readData();
  return [...d.invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
}
export async function createInvoice(input: InvoiceInput): Promise<TaxInvoice> {
  const d = await readData();
  const taxType = input.taxType ?? "과세";
  const items: TaxItem[] = (input.items ?? [])
    .filter((it) => (it.name ?? "").trim())
    .map((it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      const supply = Math.round(qty * unitPrice);
      const vat = taxType === "과세" ? Math.round(supply * 0.1) : 0;
      return { name: it.name.trim(), qty, unitPrice, supplyAmount: supply, vat };
    });
  const supplyAmount = items.reduce((s, it) => s + it.supplyAmount, 0);
  const vat = items.reduce((s, it) => s + it.vat, 0);
  const inv: TaxInvoice = {
    id: randomUUID(),
    type: "sales",
    issueDate: input.issueDate || today(),
    partnerName: (input.partnerName ?? "").trim() || "(미입력)",
    partnerBizNo: (input.partnerBizNo ?? "").trim() || undefined,
    partnerCeo: (input.partnerCeo ?? "").trim() || undefined,
    partnerEmail: (input.partnerEmail ?? "").trim() || undefined,
    items,
    supplyAmount,
    vat,
    total: supplyAmount + vat,
    taxType,
    receiveType: input.receiveType ?? "청구",
    status: "issued",
    createdAt: new Date().toISOString(),
  };
  // 팝빌(테스트) 실발행 시도 → 성공 시 실제 국세청 승인번호, 실패 시 로컬 발번으로 대체.
  if (popbillEnabled()) {
    try {
      const r = await issueTaxInvoice(inv, d.profile);
      inv.ntsConfirmNum = r.ntsConfirmNum || mockConfirmNum("");
      inv.status = "sent";
    } catch (e) {
      console.error("Popbill 세금계산서 발행 실패 — 로컬 저장으로 대체:", e);
      inv.ntsConfirmNum = mockConfirmNum("");
    }
  } else {
    inv.ntsConfirmNum = mockConfirmNum("");
  }
  d.invoices.push(inv);
  await writeData(d);
  return inv;
}

// ── 현금영수증 ──
export interface CashbillInput {
  tradeDate?: string;
  purpose?: CashReceiptPurpose;
  identityNum?: string;
  supplyAmount?: number;
}
export async function listCashReceipts(): Promise<CashReceipt[]> {
  const d = await readData();
  return [...d.cashReceipts].sort((a, b) => (a.tradeDate < b.tradeDate ? 1 : -1));
}
export async function createCashReceipt(input: CashbillInput): Promise<CashReceipt> {
  const d = await readData();
  const supply = Math.round(Number(input.supplyAmount) || 0);
  const vat = Math.round(supply * 0.1);
  const cr: CashReceipt = {
    id: randomUUID(),
    tradeDate: input.tradeDate || today(),
    purpose: input.purpose ?? "지출증빙",
    identityNum: (input.identityNum ?? "").trim(),
    supplyAmount: supply,
    vat,
    total: supply + vat,
    status: "issued",
    createdAt: new Date().toISOString(),
  };
  if (popbillEnabled()) {
    try {
      const r = await issueCashbill(cr, d.profile);
      cr.ntsConfirmNum = r.ntsConfirmNum || mockConfirmNum("CR");
    } catch (e) {
      console.error("Popbill 현금영수증 발행 실패 — 로컬 저장으로 대체:", e);
      cr.ntsConfirmNum = mockConfirmNum("CR");
    }
  } else {
    cr.ntsConfirmNum = mockConfirmNum("CR");
  }
  d.cashReceipts.push(cr);
  await writeData(d);
  return cr;
}
