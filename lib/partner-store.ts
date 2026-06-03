// ── Partner store (거래처 마스터) ──────────────────────────────────────────────
// Dual backend: Supabase Postgres when configured, else .data/partners.json.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Partner } from "./types";
import { samplePartners } from "./seed";
import { supabaseConfigured } from "./supabase";
import { jsonStore } from "./supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "partners.json");
const sb = jsonStore<Partner>("partners");

export interface PartnerInput {
  name: string;
  bizNo: string;
  ceoName?: string;
  email?: string;
  address?: string;
  memo?: string;
}

async function readAll(): Promise<Partner[]> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const rows = JSON.parse(txt);
    return Array.isArray(rows) ? (rows as Partner[]) : [];
  } catch {
    const seeded = samplePartners.map((p) => ({ ...p }));
    await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(rows: Partner[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function byNameAsc(a: Partner, b: Partner): number {
  return a.name.localeCompare(b.name, "ko");
}

export async function listPartners(): Promise<Partner[]> {
  if (supabaseConfigured()) return (await sb.list(false)).sort(byNameAsc);
  return (await readAll()).sort(byNameAsc);
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  if (supabaseConfigured()) return sb.get(id);
  return (await readAll()).find((p) => p.id === id);
}

export async function createPartner(input: PartnerInput): Promise<Partner> {
  const now = new Date().toISOString();
  const partner: Partner = {
    id: randomUUID(),
    name: input.name,
    bizNo: input.bizNo,
    ceoName: input.ceoName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  if (supabaseConfigured()) { await sb.insert(partner); return partner; }
  const rows = await readAll();
  rows.push(partner);
  await writeAll(rows);
  return partner;
}

export async function updatePartner(id: string, patch: Partial<PartnerInput>): Promise<Partner | undefined> {
  if (supabaseConfigured()) {
    const cur = await sb.get(id);
    if (!cur) return undefined;
    const next: Partner = {
      ...cur,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.bizNo !== undefined ? { bizNo: patch.bizNo } : {}),
      ...(patch.ceoName !== undefined ? { ceoName: patch.ceoName?.trim() || undefined } : {}),
      ...(patch.email !== undefined ? { email: patch.email?.trim() || undefined } : {}),
      ...(patch.address !== undefined ? { address: patch.address?.trim() || undefined } : {}),
      ...(patch.memo !== undefined ? { memo: patch.memo?.trim() || undefined } : {}),
      id: cur.id,
      createdAt: cur.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await sb.update(id, next);
    return next;
  }
  const rows = await readAll();
  const i = rows.findIndex((p) => p.id === id);
  if (i === -1) return undefined;
  const cur = rows[i];
  const next: Partner = {
    ...cur,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.bizNo !== undefined ? { bizNo: patch.bizNo } : {}),
    ...(patch.ceoName !== undefined ? { ceoName: patch.ceoName?.trim() || undefined } : {}),
    ...(patch.email !== undefined ? { email: patch.email?.trim() || undefined } : {}),
    ...(patch.address !== undefined ? { address: patch.address?.trim() || undefined } : {}),
    ...(patch.memo !== undefined ? { memo: patch.memo?.trim() || undefined } : {}),
    id: cur.id,
    createdAt: cur.createdAt,
    updatedAt: new Date().toISOString(),
  };
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deletePartner(id: string): Promise<boolean> {
  if (supabaseConfigured()) return sb.remove(id);
  const rows = await readAll();
  const next = rows.filter((p) => p.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}
