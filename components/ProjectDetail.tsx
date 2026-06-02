"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Folder, File as FileIcon, ExternalLink, FolderX, FileX,
  Pencil, Trash2, Search, ChevronRight, Check, Link2Off, Database,
} from "lucide-react";
import type { Project, Task, FileNode, NotionRef, NotionItem } from "@/lib/types";
import { StatusPill, AvatarStack } from "./ui";
import ProjectForm from "./ProjectForm";
import NotionTree from "./NotionTree";

type View = "notion" | "drive";

function fmtMoney(n?: number) {
  return n == null ? null : "₩" + n.toLocaleString("en-US");
}

// ── File tree row ──
function FileRow({ node, depth }: { node: FileNode; depth: number }) {
  const isFolder = node.mimeType === "application/vnd.google-apps.folder";
  return (
    <div>
      <a href={node.driveUrl} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-line/50"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        {isFolder ? <Folder size={15} className="shrink-0 text-coral" /> : <FileIcon size={15} className="shrink-0 text-warmgray" />}
        <span className="truncate text-charcoal">{node.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-warmgray">
          {node.modifiedTime} {node.owner ? `· ${node.owner.split("@")[0]}` : ""}
        </span>
      </a>
      {node.children?.map((c) => <FileRow key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

// ── Notion attach picker (tree: lists everything on open, expandable, pickable) ──
function NotionPicker({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NotionRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(query: string) {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/notion/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.configured) { setMsg("Notion isn't connected (no token)."); setResults([]); }
      else { setResults(data.results ?? []); if (!data.results?.length) setMsg("No matches."); }
    } catch { setMsg("Search failed."); }
    setLoading(false);
  }

  // Show ALL accessible pages/databases immediately when the picker opens.
  useEffect(() => { run(""); /* eslint-disable-next-line */ }, []);

  async function pick(ref: NotionRef) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notion: ref }),
    });
    onDone();
  }

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-sm">
        <Search size={15} className="text-warmgray" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter your Notion pages & databases…"
          className="w-full bg-transparent text-charcoal outline-none" autoFocus />
        <button type="submit" className="rounded-md bg-coral px-2.5 py-1 text-xs font-semibold text-white">
          {loading ? "…" : "Search"}
        </button>
      </form>
      <p className="mb-1 px-1 text-[11px] text-warmgray">Click ▸ to expand sub-pages · <b className="text-coral-dark">Link</b> to attach any page or database.</p>
      {loading && !results.length && <p className="px-1 py-2 text-xs text-warmgray">Loading your workspace…</p>}
      {msg && <p className="px-1 py-2 text-xs text-warmgray">{msg}</p>}
      <div className="max-h-80 overflow-y-auto">
        <NotionTree items={results.map((r) => ({ node: "ref" as const, ref: r }))} onPick={pick} />
      </div>
    </div>
  );
}

// ── Drive folder attach picker (browsable) ──
function DrivePicker({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [stack, setStack] = useState<{ id?: string; name: string }[]>([{ name: "My Drive" }]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load(parentId?: string) {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/drive/folders${parentId ? `?parent=${parentId}` : ""}`);
      const data = await res.json();
      if (!data.configured) setMsg("Google Drive isn't connected.");
      else { setFolders(data.folders ?? []); if (!data.folders?.length) setMsg("No sub-folders here."); }
    } catch { setMsg("Couldn't list folders."); }
    setLoading(false);
  }

  // Load root on first render.
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function open(f: { id: string; name: string }) {
    setStack((s) => [...s, f]);
    load(f.id);
  }
  function jump(i: number) {
    const next = stack.slice(0, i + 1);
    setStack(next);
    load(next[next.length - 1].id);
  }
  async function pick(f: { id: string; name: string }) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drive: { id: f.id, name: f.name, url: `https://drive.google.com/drive/folders/${f.id}` } }),
    });
    onDone();
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-warmgray">
        {stack.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={11} />}
            <button onClick={() => jump(i)} className="hover:text-charcoal">{s.name}</button>
          </span>
        ))}
      </div>
      {msg && <p className="px-1 py-2 text-xs text-warmgray">{msg}</p>}
      <div className="max-h-72 divide-y divide-line overflow-y-auto">
        {loading && <p className="px-2 py-3 text-xs text-warmgray">Loading…</p>}
        {folders.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-line/40">
            <Folder size={14} className="text-coral" />
            <button onClick={() => open(f)} className="flex-1 truncate text-left text-charcoal">{f.name}</button>
            <button onClick={() => pick(f)} className="flex items-center gap-1 rounded-md bg-coral/15 px-2 py-0.5 text-[11px] font-semibold text-coral-dark hover:bg-coral hover:text-white">
              <Check size={11} /> Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetail({
  project, tasks, tree, notionItems,
}: {
  project: Project;
  tasks: Task[];
  tree: FileNode[];
  notionItems: NotionItem[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(project.notion ? "notion" : project.drive ? "drive" : "notion");
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState<null | "notion" | "drive">(null);

  async function detach(which: "notion" | "drive") {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [which]: null }),
    });
    router.refresh();
  }
  async function del() {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/projects");
  }

  const money = fmtMoney(project.revenue);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-warmgray hover:text-charcoal">
        <ArrowLeft size={14} /> Projects
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            {project.code && <span className="mr-2 text-warmgray">[{project.code}]</span>}
            {project.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-warmgray">
            <StatusPill status={project.status} />
            <span className="rounded bg-line px-1.5 py-0.5 text-[11px]">{project.type}</span>
            {project.owner && <span>{project.owner}</span>}
            {project.client && <span>· {project.client}</span>}
            {money && <span className="font-mono text-charcoal">{money}</span>}
            {project.startDate && <span>{project.startDate} → {project.endDate ?? "…"}</span>}
          </div>
          {project.description && <p className="mt-2 max-w-2xl text-sm text-charcoal">{project.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/60">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={del} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-coral-dark hover:bg-coral/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Source toggle */}
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
        <button onClick={() => setView("notion")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${view === "notion" ? "bg-coral text-white" : "text-warmgray hover:text-charcoal"}`}>
          <FileText size={14} /> Notion {project.notion && <Check size={12} />}
        </button>
        <button onClick={() => setView("drive")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${view === "drive" ? "bg-coral text-white" : "text-warmgray hover:text-charcoal"}`}>
          <Folder size={14} /> Drive {project.drive && <Check size={12} />}
        </button>
      </div>

      {/* Reference panel */}
      <div className="rounded-xl border border-line bg-surface p-4">
        {view === "notion" ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-warmgray">
                {project.notion ? `Notion ${project.notion.kind}` : "Notion"}
              </span>
              {project.notion ? (
                <div className="flex items-center gap-3">
                  <a href={project.notion.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-coral-dark hover:underline">
                    Open in Notion <ExternalLink size={12} />
                  </a>
                  <button onClick={() => detach("notion")} className="flex items-center gap-1 text-xs text-warmgray hover:text-coral-dark">
                    <Link2Off size={12} /> Detach
                  </button>
                </div>
              ) : null}
            </div>
            {picking === "notion" ? (
              <NotionPicker projectId={project.id} onDone={() => { setPicking(null); router.refresh(); }} />
            ) : project.notion ? (
              notionItems.length ? <NotionTree items={notionItems} /> : <p className="px-1 py-4 text-sm text-warmgray">This Notion page has no content yet.</p>
            ) : (
              <div className="px-2 py-8 text-center">
                <FileX size={22} className="mx-auto mb-2 text-warmgray" />
                <p className="mb-3 text-sm text-warmgray">No Notion page or database connected yet.</p>
                <button onClick={() => setPicking("notion")} className="rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-white hover:bg-coral-dark">
                  Attach Notion…
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-warmgray">
                {project.drive ? `Drive · ${project.drive.name}` : "Google Drive folder"}
              </span>
              {project.drive && (
                <div className="flex items-center gap-3">
                  <a href={project.drive.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-coral-dark hover:underline">
                    Open in Drive <ExternalLink size={12} />
                  </a>
                  <button onClick={() => detach("drive")} className="flex items-center gap-1 text-xs text-warmgray hover:text-coral-dark">
                    <Link2Off size={12} /> Detach
                  </button>
                </div>
              )}
            </div>
            {picking === "drive" ? (
              <DrivePicker projectId={project.id} onDone={() => { setPicking(null); router.refresh(); }} />
            ) : project.drive ? (
              tree.length ? (
                <div>{tree.map((n) => <FileRow key={n.id} node={n} depth={0} />)}</div>
              ) : (
                <p className="px-2 py-6 text-center text-sm text-warmgray">This folder is empty.</p>
              )
            ) : (
              <div className="px-2 py-8 text-center">
                <FolderX size={22} className="mx-auto mb-2 text-warmgray" />
                <p className="mb-3 text-sm text-warmgray">No Drive folder connected yet.</p>
                <button onClick={() => setPicking("drive")} className="rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-white hover:bg-coral-dark">
                  Attach Drive folder…
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linked tasks */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-warmgray">
          Linked tasks ({tasks.length})
        </h2>
        {tasks.length ? (
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {tasks.map((t) => (
              <a key={t.id} href={t.notionUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-line/40">
                <StatusPill status={t.status} />
                <span className="flex-1 truncate text-charcoal">{t.title}</span>
                {t.dueDate && <span className="text-[11px] text-warmgray">due {t.dueDate}</span>}
                <AvatarStack people={t.assignees} />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-warmgray">No tasks linked yet.</p>
        )}
      </div>

      {editing && (
        <ProjectForm
          mode="edit"
          project={project}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
