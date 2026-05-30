// Data facade. Reads LIVE from Notion/Google Drive when credentials are present;
// otherwise serves the bundled real-data snapshot in lib/seed.ts.
// The UI only ever imports from here — snapshot → live needs no UI change.
import type { Project, Task, FileNode, DriveFolder } from "./types";
import * as seed from "./seed";
import { liveProjects, liveTasks, liveNotionMarkdown } from "./notion";
import { liveFolderTree, driveConfigured } from "./drive";

const hasNotion = !!process.env.NOTION_TOKEN;
const hasDrive = driveConfigured();

export function dataMode() {
  return {
    notion: hasNotion ? "live" : "snapshot",
    drive: hasDrive ? "live" : "snapshot",
  };
}

export async function getProjects(): Promise<Project[]> {
  if (hasNotion) {
    try { return await liveProjects(); } catch (e) { console.error("Notion live failed, using snapshot:", e); }
  }
  return seed.projects;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const all = await getProjects();
  return all.find((p) => p.id === id);
}

export async function getTasks(): Promise<Task[]> {
  if (hasNotion) {
    try { return await liveTasks(); } catch (e) { console.error("Notion live failed, using snapshot:", e); }
  }
  return seed.tasks;
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const all = await getTasks();
  return all.filter((t) => t.projectId === projectId);
}

export function getDriveFolders(): DriveFolder[] {
  return seed.driveFolders;
}

export async function getFolderTree(folderId: string | null | undefined): Promise<FileNode[]> {
  if (!folderId) return [];
  if (hasDrive) {
    try { return await liveFolderTree(folderId); } catch (e) { console.error("Drive live failed, using snapshot:", e); }
  }
  return seed.folderTrees[folderId] ?? [];
}

export async function getNotionMarkdown(project: Project): Promise<string> {
  if (hasNotion) {
    try { return await liveNotionMarkdown(project.notionPageId); } catch (e) { console.error("Notion live failed, using snapshot:", e); }
  }
  return seed.notionSnapshots[project.id] ?? "_No notes captured yet. Open this project's page in Notion._";
}
