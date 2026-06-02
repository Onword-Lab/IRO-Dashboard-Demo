// ── Finance / Transaction store (입출금 ledger) ───────────────────────────────
// Dual backend: Supabase Postgres when configured, else .data/transactions.json.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Tx, TxDirection, TxSource } from "./types";
import { sampleTransactions } from "./seed";
import { supabaseConfigured } from "./supabase";
import { jsonStore } from "./supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "transactions.json");
const sb = jsonStore<Tx>("transactions");

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
    const seeded = sampleTransactions.map((t) => ({ ...t })); // seed local file only
    await writeAll(seeded);
    return seeded;
  }
}
async function writeAll(rows: Tx[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function byDateDesc(a: Tx, b: Tx): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1;
}

function buildTx(input: TxInput, defaultSource: TxSource): Tx {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    date: input.date,
    direction: input.direction,
    counterparty: input.counterparty?.trim() || "—",
    amount: input.amount,
    balance: input.balance,
    category: input.category?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    source: input.source ?? defaultSource,
    createdAt: now,
    updatedAt: now,
  };
}

function applyPatch(cur: Tx, patch: Partial<TxInput>): Tx {
  return {
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
}

export async function listTransactions(): Promise<Tx[]> {
  if (supabaseConfigured()) return (await sb.list()).sort(byDateDesc);
  return (await readAll()).sort(byDateDesc);
}

export async function getTransactionById(id: string): Promise<Tx | undefined> {
  if (supabaseConfigured()) return sb.get(id);
  return (await readAll()).find((t) => t.id === id);
}

export async function createTransaction(input: TxInput): Promise<Tx> {
  const tx = buildTx(input, "manual");
  if (supabaseConfigured()) { await sb.insert(tx); return tx; }
  const rows = await readAll();
  rows.push(tx);
  await writeAll(rows);
  return tx;
}

export async function updateTransaction(id: string, patch: Partial<TxInput>): Promise<Tx | undefined> {
  if (supabaseConfigured()) {
    const cur = await sb.get(id);
    if (!cur) return undefined;
    const next = applyPatch(cur, patch);
    await sb.update(id, next);
    return next;
  }
  const rows = await readAll();
  const i = rows.findIndex((t) => t.id === id);
  if (i === -1) return undefined;
  const next = applyPatch(rows[i], patch);
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (supabaseConfigured()) return sb.remove(id);
  const rows = await readAll();
  const next = rows.filter((t) => t.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}

/** Bulk create — used by CSV import. */
export async function createMany(inputs: TxInput[]): Promise<Tx[]> {
  const created = inputs.map((input) => buildTx(input, "csv"));
  if (supabaseConfigured()) {
    await Promise.all(created.map((tx) => sb.insert(tx)));
    return created;
  }
  const rows = await readAll();
  rows.push(...created);
  await writeAll(rows);
  return created;
}
