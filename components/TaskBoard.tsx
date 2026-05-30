"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { StatusPill, AvatarStack, PriorityTag, Tag } from "./ui";

const COLUMNS: TaskStatus[] = ["Todo", "Doing", "Review", "Done"];

function TaskCard({ task }: { task: Task }) {
  return (
    <a
      href={task.notionUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-line bg-cream p-3 transition-shadow hover:shadow-sm"
    >
      <div className="mb-2 text-sm font-medium leading-snug text-charcoal">{task.title}</div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-warmgray">
        <PriorityTag priority={task.priority} />
        {task.dueDate && <span>· {task.dueDate}</span>}
        {task.tags.map((t) => <Tag key={t} label={t} />)}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="truncate text-[11px] text-warmgray">{task.projectName ?? "—"}</span>
        <AvatarStack people={task.assignees} />
      </div>
    </a>
  );
}

export default function TaskBoard({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Tasks</h1>
          <p className="text-sm text-warmgray">{tasks.length} tasks · from Notion “IRO Tasks”</p>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
          <button onClick={() => setView("board")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${view === "board" ? "bg-coral text-white" : "text-warmgray"}`}>
            <LayoutGrid size={14} /> Board
          </button>
          <button onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${view === "list" ? "bg-coral text-white" : "text-warmgray"}`}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="rounded-xl border border-line bg-surface p-2">
                <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                  <StatusPill status={col} />
                  <span className="text-xs text-warmgray">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => <TaskCard key={t.id} task={t} />)}
                  {!items.length && <p className="px-2 py-4 text-center text-xs text-warmgray">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {tasks.map((t) => (
            <a key={t.id} href={t.notionUrl} target="_blank" rel="noreferrer"
               className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-line/40">
              <StatusPill status={t.status} />
              <span className="flex-1 truncate text-charcoal">{t.title}</span>
              <span className="hidden truncate text-[11px] text-warmgray sm:block">{t.projectName}</span>
              {t.dueDate && <span className="text-[11px] text-warmgray">due {t.dueDate}</span>}
              <AvatarStack people={t.assignees} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
