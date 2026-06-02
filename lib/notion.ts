// LIVE Notion adapter (used only when NOTION_TOKEN is set).
// Uses the Notion REST API directly — no SDK dependency.
// Notion is an OPTIONAL attachment per project + a browsable source — it is no
// longer the source of truth for the projects list.
import type { Task, TaskStatus, Priority, Person, NotionRef, NotionItem } from "./types";

const NOTION_VERSION = "2022-06-28";
const TOKEN = process.env.NOTION_TOKEN;
// IRO Tasks database (still Notion-backed for the Tasks module).
const TASKS_DB = process.env.NOTION_TASKS_DB || "63bad047-5a4e-4039-9cf8-526a2c979658";
// Optional DB used only to resolve task→project names (legacy relation).
const TASK_PROJECTS_DB = process.env.NOTION_PROJECTS_DB || "355559df-de85-8010-af56-f00bc9851a06";

export function notionConfigured(): boolean {
  return !!TOKEN;
}

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

// ── Search (for the per-project attach picker + the Notion sidebar browser) ──
export async function searchNotion(query: string): Promise<NotionRef[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, page_size: 25 }),
    cache: "no-store",
  } as any);
  if (!res.ok) throw new Error(`Notion search failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.results ?? []).map((r: any) => {
    const kind: "page" | "database" = r.object === "database" ? "database" : "page";
    const title =
      kind === "database"
        ? (r.title ?? []).map((t: any) => t.plain_text).join("") || "(Untitled database)"
        : titleOf(r.properties ?? {});
    return { kind, id: r.id, title, url: r.url } as NotionRef;
  });
}

// ── Render an attached Notion ref into simple markdown for the Notion view ──
export async function renderNotionRef(ref: NotionRef): Promise<string> {
  if (ref.kind === "database") {
    const rows = await queryDatabase(ref.id);
    const lines = rows.map((r) => `- ${titleOf(r.properties)}`);
    return lines.length ? `### ${ref.title}\n\n${lines.join("\n")}` : `_This database has no rows yet._`;
  }
  return liveNotionMarkdown(ref.id);
}

export async function liveNotionMarkdown(pageId: string): Promise<string> {
  const id = pageId.replace(/-/g, "");
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": NOTION_VERSION },
    cache: "no-store",
  } as any);
  if (!res.ok) throw new Error(`Notion blocks ${id} failed: ${res.status}`);
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

// ── Hierarchical render: ordered items (text lines + nested page/db refs) ──
// Used by the attach picker AND the linked-content view so sub-pages are
// clickable/expandable to any depth.
function blockToMd(b: any): string | null {
  const t = b.type;
  const rt = (b[t]?.rich_text ?? []).map((x: any) => x.plain_text).join("");
  if (!rt) return null;
  if (t === "heading_1") return `# ${rt}`;
  if (t === "heading_2") return `## ${rt}`;
  if (t === "heading_3") return `### ${rt}`;
  if (t === "bulleted_list_item") return `- ${rt}`;
  if (t === "numbered_list_item") return `1. ${rt}`;
  if (t === "to_do") return `- [${b.to_do?.checked ? "x" : " "}] ${rt}`;
  return rt;
}

function notionUrlFor(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, "")}`;
}

export async function notionNodeItems(id: string, kind: "page" | "database"): Promise<NotionItem[]> {
  if (kind === "database") {
    const rows = await queryDatabase(id);
    return rows.map((r) => ({
      node: "ref" as const,
      ref: { kind: "page" as const, id: r.id, title: titleOf(r.properties), url: r.url || notionUrlFor(r.id) },
    }));
  }
  const res = await fetch(`https://api.notion.com/v1/blocks/${id.replace(/-/g, "")}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": NOTION_VERSION },
    cache: "no-store",
  } as any);
  if (!res.ok) throw new Error(`Notion blocks ${id} failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const items: NotionItem[] = [];
  for (const b of json.results ?? []) {
    if (b.type === "child_page") {
      items.push({ node: "ref", ref: { kind: "page", id: b.id, title: b.child_page?.title || "Untitled", url: notionUrlFor(b.id) } });
    } else if (b.type === "child_database") {
      items.push({ node: "ref", ref: { kind: "database", id: b.id, title: b.child_database?.title || "Untitled", url: notionUrlFor(b.id) } });
    } else {
      const md = blockToMd(b);
      if (md) items.push({ node: "text", md });
    }
  }
  return items;
}

// ── Tasks (still Notion-backed) ──
export async function liveTasks(): Promise<Task[]> {
  const [rows, projRows] = await Promise.all([
    queryDatabase(TASKS_DB),
    queryDatabase(TASK_PROJECTS_DB).catch(() => [] as any[]),
  ]);
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
