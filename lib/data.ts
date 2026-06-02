// Data facade. The UI imports ONLY from here.
//  • Projects  → our own store (lib/projects-store.ts) — dashboard-owned.
//  • Tasks     → live Notion (IRO Tasks DB), snapshot fallback.
//  • Attached Notion/Drive content → live adapters.
import type { Project, Task, FileNode, NotionRef, NotionItem } from "./types";
import * as seed from "./seed";
import { liveTasks, notionNodeItems, searchNotion, notionConfigured } from "./notion";
import { liveFolderTree, driveConfigured, listFolders } from "./drive";
import { listProjects, getProjectById } from "./projects-store";

const hasNotion = notionConfigured();
const hasDrive = driveConfigured();

export function dataMode() {
  return {
    notion: hasNotion ? "live" : "off",
    drive: hasDrive ? "live" : "off",
    store: "file" as "file" | "supabase",
  };
}

// ── Projects (dashboard-owned) ──
export async function getProjects(): Promise<Project[]> {
  return listProjects();
}
export async function getProject(id: string): Promise<Project | undefined> {
  return getProjectById(id);
}

// ── Tasks (Notion-backed) ──
export async function getTasks(): Promise<Task[]> {
  if (hasNotion) {
    try { return await liveTasks(); } catch (e) { console.error("Notion tasks failed, using snapshot:", e); }
  }
  return seed.tasks;
}
// Best-effort link: match a task's project name to this project's name.
export async function getTasksForProject(project: Project): Promise<Task[]> {
  const all = await getTasks();
  const name = project.name.trim().toLowerCase();
  if (!name) return [];
  return all.filter((t) => (t.projectName ?? "").trim().toLowerCase() === name);
}

// ── Attached Drive folder ──
export async function getFolderTree(folderId: string | null | undefined): Promise<FileNode[]> {
  if (!folderId) return [];
  if (hasDrive) {
    try { return await liveFolderTree(folderId); } catch (e) { console.error("Drive live failed, using snapshot:", e); }
  }
  return seed.folderTrees[folderId] ?? [];
}

// ── Attached Notion ref (top-level items; children fetched on expand) ──
export async function getNotionItemsForRef(ref: NotionRef | null | undefined): Promise<NotionItem[]> {
  if (hasNotion && ref) {
    try { return await notionNodeItems(ref.id, ref.kind); } catch (e) { console.error("Notion render failed:", e); }
  }
  return [];
}

// Re-exports used by API routes / browse pages.
export { searchNotion, listFolders, notionNodeItems };
export const notionLive = hasNotion;
export const driveLive = hasDrive;
