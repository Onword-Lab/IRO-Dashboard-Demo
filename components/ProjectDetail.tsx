"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, FileText, Folder, File as FileIcon, ExternalLink, FolderX,
} from "lucide-react";
import type { Project, Task, FileNode, DriveFolder } from "@/lib/types";
import { StatusPill, AvatarStack, PriorityTag } from "./ui";

type View = "notion" | "drive";

function FileRow({ node, depth }: { node: FileNode; depth: number }) {
  const isFolder = node.mimeType === "application/vnd.google-apps.folder";
  return (
    <div>
      <a
        href={node.driveUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-line/50"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <Folder size={15} className="shrink-0 text-coral" />
        ) : (
          <FileIcon size={15} className="shrink-0 text-warmgray" />
        )}
        <span className="truncate text-charcoal">{node.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-warmgray">
          {node.modifiedTime} {node.owner ? `· ${node.owner.split("@")[0]}` : ""}
        </span>
      </a>
      {node.children?.map((c) => (
        <FileRow key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

function NotionMarkdown({ md }: { md: string }) {
  const lines = md.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-charcoal">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("### ")) return <h4 key={i} className="pt-2 font-semibold">{line.slice(4)}</h4>;
        if (line.startsWith("## ")) return <h3 key={i} className="pt-2 text-base font-semibold">{line.slice(3)}</h3>;
        if (line.startsWith("# ")) return <h2 key={i} className="pt-2 text-lg font-bold">{line.slice(2)}</h2>;
        const m = line.match(/^(\s*)- (.*)$/);
        if (m) return (
          <div key={i} className="flex gap-2" style={{ paddingLeft: `${m[1].length * 6}px` }}>
            <span className="text-coral">•</span>
            <span>{m[2].replace(/\*\*/g, "")}</span>
          </div>
        );
        return <p key={i}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function ProjectDetail({
  project, tasks, tree, notionMarkdown, folders,
}: {
  project: Project;
  tasks: Task[];
  tree: FileNode[];
  notionMarkdown: string;
  folders: DriveFolder[];
}) {
  const [view, setView] = useState<View>("notion");

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-warmgray hover:text-charcoal">
        <ArrowLeft size={14} /> Projects
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-warmgray">
            <StatusPill status={project.status} />
            <AvatarStack people={project.assignees} />
            <PriorityTag priority={project.priority} />
            {project.startDate && <span>{project.startDate} → {project.endDate ?? "…"}</span>}
            {project.team?.map((t) => (
              <span key={t} className="rounded bg-line px-1.5 py-0.5 text-[11px]">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Source toggle */}
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
        <button
          onClick={() => setView("notion")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
            view === "notion" ? "bg-coral text-white" : "text-warmgray hover:text-charcoal"
          }`}
        >
          <FileText size={14} /> Notion
        </button>
        <button
          onClick={() => setView("drive")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
            view === "drive" ? "bg-coral text-white" : "text-warmgray hover:text-charcoal"
          }`}
        >
          <Folder size={14} /> Drive
        </button>
      </div>

      {/* Reference panel */}
      <div className="rounded-xl border border-line bg-surface p-4">
        {view === "notion" ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-warmgray">
                Notion page
              </span>
              <a href={project.notionUrl} target="_blank" rel="noreferrer"
                 className="flex items-center gap-1 text-xs text-coral-dark hover:underline">
                Open in Notion <ExternalLink size={12} />
              </a>
            </div>
            <NotionMarkdown md={notionMarkdown} />
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-warmgray">
                Google Drive folder
              </span>
            </div>
            {project.driveFolderId ? (
              tree.length ? (
                <div>{tree.map((n) => <FileRow key={n.id} node={n} depth={0} />)}</div>
              ) : (
                <p className="px-2 py-6 text-center text-sm text-warmgray">This folder is empty.</p>
              )
            ) : (
              <div className="px-2 py-6 text-center">
                <FolderX size={22} className="mx-auto mb-2 text-warmgray" />
                <p className="mb-3 text-sm text-warmgray">No Drive folder linked to this project yet.</p>
                <select
                  defaultValue=""
                  className="rounded-md border border-line bg-cream px-3 py-1.5 text-sm text-charcoal"
                >
                  <option value="" disabled>Link a Drive folder…</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-warmgray">(manual pick — wired to persist in M1)</p>
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
    </div>
  );
}
