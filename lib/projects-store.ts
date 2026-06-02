// ── Project store (the dashboard's OWN backend) ──────────────────────────────
// Source of truth for projects — independent of Notion/Drive.
//
// Dual backend (single seam):
//   • Supabase Postgres  — when SUPABASE_URL + key are set (prod / Vercel)
//   • JSON file .data/projects.json — local dev fallback
// Selected automatically by supabaseConfigured(); the routes/UI never change.

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Project, ProjectType, ProjectStatus, NotionRef, DriveRef } from "./types";
import { supabaseConfigured } from "./supabase";
import { jsonStore } from "./supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "projects.json");
const sb = jsonStore<Project>("projects");

export interface ProjectInput {
  name?: string;
  code?: string;
  client?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  owner?: string;
  revenue?: number | null;
  startDate?: string;
  endDate?: string;
  description?: string;
  notion?: NotionRef | null;
  drive?: DriveRef | null;
}

async function readAll(): Promise<Project[]> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const rows = JSON.parse(txt);
    return Array.isArray(rows) ? (rows as Project[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: Project[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function clean(s?: string): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

// Field-by-field merge shared by both backends.
function applyPatch(cur: Project, patch: ProjectInput): Project {
  return {
    ...cur,
    ...(patch.name !== undefined ? { name: clean(patch.name) || cur.name } : {}),
    ...(patch.code !== undefined ? { code: clean(patch.code) } : {}),
    ...(patch.client !== undefined ? { client: clean(patch.client) } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.owner !== undefined ? { owner: clean(patch.owner) } : {}),
    ...(patch.revenue !== undefined
      ? { revenue: typeof patch.revenue === "number" ? patch.revenue : undefined }
      : {}),
    ...(patch.startDate !== undefined ? { startDate: clean(patch.startDate) } : {}),
    ...(patch.endDate !== undefined ? { endDate: clean(patch.endDate) } : {}),
    ...(patch.description !== undefined ? { description: clean(patch.description) } : {}),
    ...(patch.notion !== undefined ? { notion: patch.notion } : {}),
    ...(patch.drive !== undefined ? { drive: patch.drive } : {}),
    id: cur.id,
    createdAt: cur.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function listProjects(): Promise<Project[]> {
  if (supabaseConfigured()) return sb.list(true);
  const rows = await readAll();
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  if (supabaseConfigured()) return sb.get(id);
  return (await readAll()).find((p) => p.id === id);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    name: clean(input.name) || "Untitled project",
    code: clean(input.code),
    client: clean(input.client),
    type: input.type ?? "Other",
    status: input.status ?? "Planned",
    owner: clean(input.owner),
    revenue: typeof input.revenue === "number" ? input.revenue : undefined,
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    description: clean(input.description),
    notion: input.notion ?? null,
    drive: input.drive ?? null,
    createdAt: now,
    updatedAt: now,
  };
  if (supabaseConfigured()) {
    await sb.insert(project);
    return project;
  }
  const rows = await readAll();
  rows.push(project);
  await writeAll(rows);
  return project;
}

export async function updateProject(id: string, patch: ProjectInput): Promise<Project | undefined> {
  if (supabaseConfigured()) {
    const cur = await sb.get(id);
    if (!cur) return undefined;
    const next = applyPatch(cur, patch);
    await sb.update(id, next);
    return next;
  }
  const rows = await readAll();
  const i = rows.findIndex((p) => p.id === id);
  if (i === -1) return undefined;
  const next = applyPatch(rows[i], patch);
  rows[i] = next;
  await writeAll(rows);
  return next;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (supabaseConfigured()) return sb.remove(id);
  const rows = await readAll();
  const next = rows.filter((p) => p.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  return true;
}
