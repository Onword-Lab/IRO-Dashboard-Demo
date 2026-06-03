// ── Connections store (계좌/카드 연동 + 거래내역) ──────────────────────────────
// Dual backend: Supabase Postgres when configured, else .data/connections.json.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { BankAccount, BankTxn, ConnectionKind } from "./types";
import { sampleBankAccounts, sampleBankTxns } from "./seed";
import { supabaseConfigured } from "./supabase";
import { jsonStore } from "./supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "connections.json");

const sbAccounts = jsonStore<BankAccount>("bank_accounts");
const sbTxns = jsonStore<BankTxn>("bank_txns");

// ── File-store helpers ────────────────────────────────────────────────────────

interface ConnectionsFile {
  accounts: BankAccount[];
  txns: BankTxn[];
}

async function readFile(): Promise<ConnectionsFile> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(txt);
    return {
      accounts: Array.isArray(parsed.accounts) ? (parsed.accounts as BankAccount[]) : [],
      txns: Array.isArray(parsed.txns) ? (parsed.txns as BankTxn[]) : [],
    };
  } catch {
    // First read: seed from sample data
    const seeded: ConnectionsFile = {
      accounts: sampleBankAccounts.map((a) => ({ ...a })),
      txns: sampleBankTxns.map((t) => ({ ...t })),
    };
    await writeFile(seeded);
    return seeded;
  }
}

async function writeFile(data: ConnectionsFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function listAccounts(): Promise<BankAccount[]> {
  if (supabaseConfigured()) return sbAccounts.list(false);
  return (await readFile()).accounts;
}

export async function addAccount(input: {
  kind: ConnectionKind;
  label: string;
  accountNo: string;
  holder?: string;
}): Promise<{ account: BankAccount; txns: BankTxn[] }> {
  const { mockTxnsFor } = await import("./popbill-bank");

  const account: BankAccount = {
    id: randomUUID(),
    kind: input.kind,
    label: input.label,
    accountNo: input.accountNo,
    holder: input.holder,
    addedAt: new Date().toISOString(),
  };

  const txns = mockTxnsFor(account);

  if (supabaseConfigured()) {
    await sbAccounts.insert(account);
    await Promise.all(txns.map((t) => sbTxns.insert(t)));
    return { account, txns };
  }

  const data = await readFile();
  data.accounts.push(account);
  data.txns.push(...txns);
  await writeFile(data);
  return { account, txns };
}

export async function listTxns(): Promise<BankTxn[]> {
  if (supabaseConfigured()) {
    const all = await sbTxns.list(false);
    return all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }
  const data = await readFile();
  return data.txns.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function markIssued(txnIds: string[], invoiceId: string): Promise<void> {
  if (supabaseConfigured()) {
    const all = await sbTxns.list(false);
    await Promise.all(
      all
        .filter((t) => txnIds.includes(t.id))
        .map((t) => sbTxns.update(t.id, { ...t, issuedInvoiceId: invoiceId })),
    );
    return;
  }

  const data = await readFile();
  for (const t of data.txns) {
    if (txnIds.includes(t.id)) t.issuedInvoiceId = invoiceId;
  }
  await writeFile(data);
}
