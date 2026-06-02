// ── Finance / Transaction store ───────────────────────────────────────────────
// Dashboard-owned ledger for 입출금 (banking transactions).
// Backend swap plan (same as projects-store):
//   • NOW: JSON file at .data/transactions.json
//   • LATER: Supabase Postgres

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Tx, TxDirection, TxSource } from "./types";
import { sampleTransactions } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "transactions.json");

export interface TxInput {
  date: string;
  direction: TxDirection;
  counterparty: string;
  amount: number;
  balance?: number;
  category?: string;
  memo?: string;
  source?: TxSource;
}

async function readAll(): Promise<Tx[]> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const rows = JSON.parse(txt);
    return Array.isArray(rows) ? (rows as Tx[]) : [];
  } catch {
    // File doesn't exist yet — seed with sample data.
    const seeded = sampleTransactions.map((t) => ({ ...t }));
    await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(rows: Tx[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

/** List all transactions sorted by date desc, then createdAt desc. */
export async function listTransactions(): Promise<Tx[]> {
  const rows = await readAll();
  return rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export async function getTransactionById(id: string): Promise<Tx | undefined> {
  return (await readAll()).find((t) => t.id === id);
}

export async function createTransaction(input: TxInput): Promise<Tx> {
  const rows = await readAll();
  const now = new Date().toISOString();
  const tx: Tx = {
    id: randomUUID(),
    date: input.date,
    direction: input.direction,
    counterparty: input.counterparty?.trim() || "—",
    amount: input.amount,
    balance: input.balance,
    category: input.category?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    source: input.source ?? "manual",
    createdAt: now,
    updatedAt: now,
  };
  rows.push(tx);
  await writeAll(rows);
  return tx;
}

export async function updateTransaction(
  id: string,
  patch: Partial<TxInput>,
): Promise<Tx | undefined> {
  const rows = await readAll();
  const i = rows.findIndex((t) => t.id === id);
  if (i === -1) return undefined;
  const cur = rows[i];
  const next: Tx = {
    ...cur,
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.direction !== undefined ? { direction: patch.direction } : {}),
    ...(patch.counterparty !== undefined ? { counterparty: patch.counterparty?.trim() || "—" } : {}),
    ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    ...(patch.balance !== undefined ? { balance: patch.balance } : {}),
    ...(patch.category !== undefined ? { category: patch.category?.trim() || undefined } : {}),
    ...(patch.memo !== undefined ? { memo: patch.memo?.trim() || undefined } : {}),
    ...(patch.source !== undefined ? { source: patch.source } : {}),
    id: cur.id,
    createdAt: cur.createdAt,
    updatedAt: new Date().toISOString(),
  };
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const rows = await readAll();
  const next = rows.filter((t) => t.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}

/** Bulk create — used by CSV import. */
export async function createMany(inputs: TxInput[]): Promise<Tx[]> {
  const rows = await readAll();
  const now = new Date().toISOString();
  const created: Tx[] = inputs.map((input) => ({
    id: randomUUID(),
    date: input.date,
    direction: input.direction,
    counterparty: input.counterparty?.trim() || "—",
    amount: input.amount,
    balance: input.balance,
    category: input.category?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    source: input.source ?? "csv",
    createdAt: now,
    updatedAt: now,
  }));
  rows.push(...created);
  await writeAll(rows);
  return created;
}
