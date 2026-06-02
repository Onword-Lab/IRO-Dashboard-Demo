// ── Contacts store (명함) ─────────────────────────────────────────────────────
// Dual backend: Supabase Postgres when configured, else .data/contacts.json.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Contact, ContactSource } from "./types";
import { sampleContacts } from "./seed";
import { supabaseConfigured } from "./supabase";
import { jsonStore } from "./supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "contacts.json");
const sb = jsonStore<Contact>("contacts");

export interface ContactInput {
  name?: string;
  company?: string;
  title?: string;
  phones?: string[];
  emails?: string[];
  note?: string;
  source?: ContactSource;
  photoUrl?: string;
}

async function readAll(): Promise<Contact[]> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const rows = JSON.parse(txt);
    return Array.isArray(rows) ? (rows as Contact[]) : [];
  } catch {
    const seeded = sampleContacts.map((c) => ({ ...c })); // seed local file only
    await writeAll(seeded);
    return seeded;
  }
}
async function writeAll(rows: Contact[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function clean(s?: string): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}
const byName = (a: Contact, b: Contact) => a.name.localeCompare(b.name, "ko");

function buildContact(input: ContactInput): Contact {
  return {
    id: randomUUID(),
    name: clean(input.name) || "Unknown",
    company: clean(input.company),
    title: clean(input.title),
    phones: input.phones?.map((p) => p.trim()).filter(Boolean) ?? [],
    emails: input.emails?.map((e) => e.trim()).filter(Boolean) ?? [],
    note: clean(input.note),
    source: input.source ?? "manual",
    photoUrl: clean(input.photoUrl),
  };
}

function applyPatch(cur: Contact, patch: ContactInput): Contact {
  return {
    ...cur,
    ...(patch.name !== undefined ? { name: clean(patch.name) || cur.name } : {}),
    ...(patch.company !== undefined ? { company: clean(patch.company) } : {}),
    ...(patch.title !== undefined ? { title: clean(patch.title) } : {}),
    ...(patch.phones !== undefined ? { phones: patch.phones.map((p) => p.trim()).filter(Boolean) } : {}),
    ...(patch.emails !== undefined ? { emails: patch.emails.map((e) => e.trim()).filter(Boolean) } : {}),
    ...(patch.note !== undefined ? { note: clean(patch.note) } : {}),
    ...(patch.source !== undefined ? { source: patch.source } : {}),
    ...(patch.photoUrl !== undefined ? { photoUrl: clean(patch.photoUrl) } : {}),
    id: cur.id,
  };
}

export async function listContacts(): Promise<Contact[]> {
  if (supabaseConfigured()) return (await sb.list()).sort(byName);
  return (await readAll()).sort(byName);
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (supabaseConfigured()) return sb.get(id);
  return (await readAll()).find((c) => c.id === id);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const contact = buildContact(input);
  if (supabaseConfigured()) { await sb.insert(contact); return contact; }
  const rows = await readAll();
  rows.push(contact);
  await writeAll(rows);
  return contact;
}

export async function updateContact(id: string, patch: ContactInput): Promise<Contact | undefined> {
  if (supabaseConfigured()) {
    const cur = await sb.get(id);
    if (!cur) return undefined;
    const next = applyPatch(cur, patch);
    await sb.update(id, next);
    return next;
  }
  const rows = await readAll();
  const i = rows.findIndex((c) => c.id === id);
  if (i === -1) return undefined;
  const next = applyPatch(rows[i], patch);
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deleteContact(id: string): Promise<boolean> {
  if (supabaseConfigured()) return sb.remove(id);
  const rows = await readAll();
  const next = rows.filter((c) => c.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}
