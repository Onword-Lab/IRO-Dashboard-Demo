// LIVE Notion adapter (used only when NOTION_TOKEN is set).
// Uses the Notion REST API directly — no SDK dependency.
import type { Project, Task, ProjectStatus, TaskStatus, Priority, Person } from "./types";
import { driveLinks } from "./links";

const NOTION_VERSION = "2022-06-28";
const TOKEN = process.env.NOTION_TOKEN;
// Database IDs (NOT data-source/collection IDs) — the /databases/{id}/query endpoint needs these.
// Projects source = "Project Hub" DB (its rows are the projects: IRO, ONWORD, 호핑 Hoping, …).
const PROJECTS_DB = process.env.NOTION_PROJECTS_DB || "355559df-de85-8010-af56-f00bc9851a06";
const TASKS_DB = process.env.NOTION_TASKS_DB || "63bad047-5a4e-4039-9cf8-526a2c979658";

function titleOf(props: any): string {
  const k = Object.keys(props).find((key) => props[key]?.type === "title");
  return (k ? plain(props[k]) : "") || "(Untitled)";
}

function slug(name: string, id: string): string {
  const s = name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "");
  return s || id.replace(/-/g, "").slice(0, 12);
}

async function queryDatabase(databaseId: string): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
    cache: "no-store",
  } as any);
  if (!res.ok) throw new Error(`Notion query ${databaseId} failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.results ?? [];
}

function plain(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title ?? []).map((t: any) => t.plain_text).join("");
  if (prop.type === "rich_text") return (prop.rich_text ?? []).map((t: any) => t.plain_text).join("");
  if (prop.type === "url") return prop.url ?? "";
  return "";
}
function selectName(prop: any): string | undefined { return prop?.select?.name ?? prop?.status?.name; }
function people(prop: any): Person[] {
  return (prop?.people ?? []).map((p: any) => ({ id: p.id, name: p.name ?? "Unknown", email: p.person?.email }));
}
function multi(prop: any): string[] { return (prop?.multi_select ?? []).map((o: any) => o.name); }
function dateStart(prop: any): string | undefined { return prop?.date?.start; }

export async function liveProjects(): Promise<Project[]> {
  const rows = await queryDatabase(PROJECTS_DB);
  return rows.map((r) => {
    const p = r.properties;
    const name = titleOf(p);
    const id = slug(name, r.id);
    return {
      id,
      name,
      status: (selectName(p["Status"]) as ProjectStatus) || "Not started",
      assignees: people(p["Assignee"]),
      priority: selectName(p["Priority"]) as Priority | undefined,
      startDate: dateStart(p["Start date"]),
      endDate: dateStart(p["End date"]),
      team: multi(p["Team"]),
      notionUrl: r.url,
      notionPageId: r.id.replace(/-/g, ""),
      driveFolderId: driveLinks[id] ?? null, // merge the manual Drive link
    } as Project;
  });
}

export async function liveTasks(): Promise<Task[]> {
  const [rows, projRows] = await Promise.all([queryDatabase(TASKS_DB), queryDatabase(PROJECTS_DB)]);
  const projById: Record<string, { name: string; slug: string }> = {};
  for (const pr of projRows) {
    const nm = titleOf(pr.properties);
    projById[pr.id] = { name: nm, slug: slug(nm, pr.id) };
  }
  return rows.map((r) => {
    const p = r.properties;
    const rel = (p["Project"]?.relation ?? [])[0]?.id;
    const proj = rel ? projById[rel] : undefined;
    return {
      id: r.id,
      title: plain(p["Task"]) || "(Untitled task)",
      status: (selectName(p["Status"]) as TaskStatus) || "Todo",
      priority: selectName(p["Priority"]) as Priority | undefined,
      assignees: people(p["Assignee"]),
      dueDate: dateStart(p["Due date"]),
      projectId: proj?.slug,
      projectName: proj?.name,
      tags: multi(p["Tags"]),
      notes: plain(p["Notes"]),
      source: plain(p["Source"]) || undefined,
      notionUrl: r.url,
    } as Task;
  });
}

export async function liveNotionMarkdown(pageId: string): Promise<string> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": NOTION_VERSION },
    cache: "no-store",
  } as any);
  if (!res.ok) throw new Error(`Notion blocks ${pageId} failed: ${res.status}`);
  const json = await res.json();
  const lines: string[] = [];
  for (const b of json.results ?? []) {
    const t = b.type;
    if (t === "child_page") { lines.push(`- 📄 ${b.child_page?.title ?? "Untitled"}`); continue; }
    if (t === "child_database") { lines.push(`- 🗄️ ${b.child_database?.title ?? "Untitled"}`); continue; }
    const rt = (b[t]?.rich_text ?? []).map((x: any) => x.plain_text).join("");
    if (!rt) continue;
    if (t === "heading_1") lines.push(`# ${rt}`);
    else if (t === "heading_2") lines.push(`## ${rt}`);
    else if (t === "heading_3") lines.push(`### ${rt}`);
    else if (t === "bulleted_list_item") lines.push(`- ${rt}`);
    else if (t === "numbered_list_item") lines.push(`1. ${rt}`);
    else if (t === "to_do") lines.push(`- [${b.to_do?.checked ? "x" : " "}] ${rt}`);
    else lines.push(rt);
  }
  return lines.join("\n\n") || "_This Notion page has no text blocks yet._";
}
