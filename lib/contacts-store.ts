// ── Contacts store (명함 / contact management) ───────────────────────────────
// Mirrors lib/projects-store.ts for the Contact domain.
// Backend: .data/contacts.json (local dev / preview); swap to Supabase later.

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Contact, ContactSource } from "./types";
import { sampleContacts } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "contacts.json");

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
    // File missing — seed with sample contacts on first read.
    const seeded = sampleContacts;
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

export async function listContacts(): Promise<Contact[]> {
  const rows = await readAll();
  return rows.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export async function getContact(id: string): Promise<Contact | undefined> {
  return (await readAll()).find((c) => c.id === id);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const rows = await readAll();
  const contact: Contact = {
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
  rows.push(contact);
  await writeAll(rows);
  return contact;
}

export async function updateContact(
  id: string,
  patch: ContactInput,
): Promise<Contact | undefined> {
  const rows = await readAll();
  const i = rows.findIndex((c) => c.id === id);
  if (i === -1) return undefined;
  const cur = rows[i];
  const next: Contact = {
    ...cur,
    ...(patch.name !== undefined ? { name: clean(patch.name) || cur.name } : {}),
    ...(patch.company !== undefined ? { company: clean(patch.company) } : {}),
    ...(patch.title !== undefined ? { title: clean(patch.title) } : {}),
    ...(patch.phones !== undefined
      ? { phones: patch.phones.map((p) => p.trim()).filter(Boolean) }
      : {}),
    ...(patch.emails !== undefined
      ? { emails: patch.emails.map((e) => e.trim()).filter(Boolean) }
      : {}),
    ...(patch.note !== undefined ? { note: clean(patch.note) } : {}),
    ...(patch.source !== undefined ? { source: patch.source } : {}),
    ...(patch.photoUrl !== undefined ? { photoUrl: clean(patch.photoUrl) } : {}),
    id: cur.id,
  };
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deleteContact(id: string): Promise<boolean> {
  const rows = await readAll();
  const next = rows.filter((c) => c.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}
