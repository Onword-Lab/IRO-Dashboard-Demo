"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, FolderKanban, PlayCircle, UserX, Wallet, FileText, Folder, EyeOff, Eye,
  Pencil, Trash2,
} from "lucide-react";
import type { Project, ProjectType, ProjectStatus } from "@/lib/types";
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/types";
import { StatusPill } from "./ui";
import ProjectForm from "./ProjectForm";

function fmtMoney(n?: number) {
  if (n == null) return "—";
  return "₩" + n.toLocaleString("en-US");
}

export default function ProjectsView({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState<ProjectType | "all">("all");
  const [statusF, setStatusF] = useState<ProjectStatus | "all">("all");
  const [ownerF, setOwnerF] = useState<string | "all">("all");
  const [masked, setMasked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  async function remove(p: Project) {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    router.refresh();
  }

  // KPIs (computed from the FULL list, not the filtered view).
  const kpis = useMemo(() => {
    const inProgress = projects.filter((p) => p.status === "In progress").length;
    const unassigned = projects.filter((p) => !p.owner?.trim()).length;
    const revenue = projects.reduce((s, p) => s + (p.revenue ?? 0), 0);
    return { total: projects.length, inProgress, unassigned, revenue };
  }, [projects]);

  // Owners (split comma-separated, dedupe) for the owner filter row.
  const owners = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      const names = (p.owner ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      for (const n of names) map.set(n, (map.get(n) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  const countByType = (t: ProjectType) => projects.filter((p) => p.type === t).length;
  const countByStatus = (s: ProjectStatus) => projects.filter((p) => p.status === s).length;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (typeF !== "all" && p.type !== typeF) return false;
      if (statusF !== "all" && p.status !== statusF) return false;
      if (ownerF !== "all" && !(p.owner ?? "").toLowerCase().includes(ownerF.toLowerCase())) return false;
      if (needle) {
        const hay = [p.name, p.code, p.client, p.status, p.owner, p.type].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [projects, q, typeF, statusF, ownerF]);

  const mask = (s?: string) => (masked ? "●●●●" : s ?? "—");

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Project Management</h1>
          <p className="text-sm text-warmgray">Add, track, and connect every project to its Notion &amp; Drive.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMasked((m) => !m)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              masked ? "border-amber bg-amber/15 text-amber" : "border-line text-warmgray hover:text-charcoal"
            }`}
            title="Hide client names & revenue for screen-sharing"
          >
            {masked ? <EyeOff size={15} /> : <Eye size={15} />} {masked ? "Masking on" : "Masking"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            <Plus size={16} /> Add Project
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={FolderKanban} label="Total projects" value={String(kpis.total)} hint="all registered" />
        <Kpi icon={PlayCircle} label="In progress" value={String(kpis.inProgress)} hint="active stage" tone="coral" />
        <Kpi icon={UserX} label="No owner" value={String(kpis.unassigned)} hint="needs an owner" tone="amber" />
        <Kpi icon={Wallet} label="Cumulative revenue" value={masked ? "₩●●●" : fmtMoney(kpis.revenue)} hint="across projects" tone="sage" />
      </div>

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
        <Search size={15} className="text-warmgray" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, client, status, owner…"
          className="w-full bg-transparent text-charcoal outline-none placeholder:text-warmgray"
        />
      </div>

      {/* Filter chip rows */}
      <div className="mb-1 space-y-1.5">
        <ChipRow>
          <Chip active={typeF === "all"} onClick={() => setTypeF("all")} label="All types" count={projects.length} />
          {PROJECT_TYPES.map((t) => (
            <Chip key={t} active={typeF === t} onClick={() => setTypeF(t)} label={t} count={countByType(t)} />
          ))}
        </ChipRow>
        <ChipRow>
          <Chip active={statusF === "all"} onClick={() => setStatusF("all")} label="All status" count={projects.length} />
          {PROJECT_STATUSES.map((s) => (
            <Chip key={s} active={statusF === s} onClick={() => setStatusF(s)} label={s} count={countByStatus(s)} />
          ))}
        </ChipRow>
        {owners.length > 0 && (
          <ChipRow>
            <Chip active={ownerF === "all"} onClick={() => setOwnerF("all")} label="All owners" count={projects.length} />
            {owners.map(([name, count]) => (
              <Chip key={name} active={ownerF === name} onClick={() => setOwnerF(name)} label={masked ? "●●●" : name} count={count} />
            ))}
          </ChipRow>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wider text-warmgray">
            <tr>
              <Th>Project</Th>
              <Th>Client</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Owner</Th>
              <Th className="text-right">Revenue</Th>
              <Th>Start</Th>
              <Th>Links</Th>
              <Th className="text-right">Edit</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="cursor-pointer transition-colors hover:bg-line/40"
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium text-charcoal">
                    {p.code && <span className="mr-1.5 text-warmgray">[{p.code}]</span>}
                    {p.name}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-warmgray">{mask(p.client)}</td>
                <td className="px-3 py-2.5"><TypeTag type={p.type} /></td>
                <td className="px-3 py-2.5"><StatusPill status={p.status} /></td>
                <td className="px-3 py-2.5 text-warmgray">{p.owner ? mask(p.owner) : <span className="text-amber">—</span>}</td>
                <td className="px-3 py-2.5 text-right font-mono text-[13px] text-charcoal">{masked ? "₩●●●" : fmtMoney(p.revenue)}</td>
                <td className="px-3 py-2.5 font-mono text-[12px] text-warmgray">{p.startDate ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-warmgray">
                    <FileText size={13} className={p.notion ? "text-charcoal" : "text-line"} />
                    <Folder size={13} className={p.drive ? "text-sage" : "text-line"} />
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(p); }}
                      title="Edit project"
                      className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[12px] text-charcoal hover:bg-line/60"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(p); }}
                      title="Delete project"
                      className="rounded-md border border-line px-1.5 py-1 text-coral-dark hover:bg-coral/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-4 py-14 text-center">
            {projects.length === 0 ? (
              <>
                <FolderKanban size={26} className="mx-auto mb-3 text-warmgray/60" />
                <p className="mb-1 text-sm font-medium text-charcoal">No projects yet</p>
                <p className="mb-4 text-sm text-warmgray">Add your first project — then connect its Notion page and Drive folder.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
                >
                  <Plus size={16} /> Add Project
                </button>
              </>
            ) : (
              <p className="text-sm text-warmgray">No projects match these filters.</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-warmgray">
        {filtered.length} of {projects.length} shown · stored in the dashboard (local file now · Supabase on deploy)
      </p>

      {showForm && (
        <ProjectForm
          mode="create"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); router.refresh(); }}
        />
      )}
      {editing && (
        <ProjectForm
          mode="edit"
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

const TYPE_STYLE: Record<ProjectType, string> = {
  Agency: "bg-coral/12 text-coral-dark",
  Education: "bg-sage/15 text-sage",
  Content: "bg-amber/15 text-amber",
  Internal: "bg-line text-warmgray",
  Other: "bg-line text-warmgray",
};
function TypeTag({ type }: { type: ProjectType }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[type]}`}>{type}</span>;
}

function Kpi({ icon: Icon, label, value, hint, tone = "default" }: {
  icon: any; label: string; value: string; hint: string; tone?: "default" | "coral" | "amber" | "sage";
}) {
  const toneCls =
    tone === "coral" ? "text-coral" : tone === "amber" ? "text-amber" : tone === "sage" ? "text-sage" : "text-charcoal";
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-warmgray">{label}</span>
        <Icon size={16} className={toneCls} />
      </div>
      <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-warmgray">{hint}</div>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-coral text-white" : "bg-surface text-warmgray hover:bg-line/70 border border-line"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-line text-warmgray"}`}>{count}</span>
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 font-semibold ${className}`}>{children}</th>;
}
