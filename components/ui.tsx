import type { ReactNode } from "react";
import type { ProjectStatus, TaskStatus, Priority, Person } from "@/lib/types";

const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  Planned: "bg-line text-warmgray",
  "In progress": "bg-coral/15 text-coral-dark",
  Done: "bg-sage/20 text-sage",
  "On hold": "bg-amber/20 text-amber",
  Cancelled: "bg-charcoal/10 text-warmgray line-through",
};

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  Todo: "bg-line text-warmgray",
  Doing: "bg-coral/15 text-coral-dark",
  Review: "bg-amber/20 text-amber",
  Done: "bg-sage/20 text-sage",
};

export function StatusPill({ status }: { status: ProjectStatus | TaskStatus }) {
  const cls =
    (PROJECT_STATUS_STYLE as Record<string, string>)[status] ||
    (TASK_STATUS_STYLE as Record<string, string>)[status] ||
    "bg-line text-warmgray";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function PriorityTag({ priority }: { priority?: Priority }) {
  if (!priority) return null;
  const color =
    priority === "High" ? "text-coral-dark" : priority === "Medium" ? "text-amber" : "text-warmgray";
  return <span className={`text-xs font-medium ${color}`}>● {priority}</span>;
}

export function Avatar({ person }: { person: Person }) {
  const initials = person.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      title={person.name}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-coral/20 text-[10px] font-semibold text-coral-dark"
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people }: { people: Person[] }) {
  if (!people.length) return <span className="text-xs text-warmgray">—</span>;
  return (
    <span className="flex -space-x-1.5">
      {people.map((p) => (
        <Avatar key={p.id} person={p} />
      ))}
    </span>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-warmgray">{label}</span>
  );
}

// ── v0.3 shared primitives (used by Calendar/Mail/Contacts/Tax/Banking/Code) ──

/** sample/live data-state badge shown next to a page title. */
export function SourceBadge({ live, sampleLabel = "sample", liveLabel = "live" }: { live: boolean; sampleLabel?: string; liveLabel?: string }) {
  return (
    <span
      title={live ? "Connected to the real API" : "Showing sample data — finish setup to go live"}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${live ? "bg-sage/20 text-sage" : "bg-amber/20 text-amber"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-sage" : "bg-amber"}`} />
      {live ? liveLabel : sampleLabel}
    </span>
  );
}

/** standard page header: title + optional badge, subtitle, right-aligned actions. */
export function PageHeader({ title, subtitle, badge, actions }: { title: string; subtitle?: string; badge?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-warmgray">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** small KPI tile for summary rows. */
export function KpiCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-warmgray">{label}</div>
      <div className="mt-1 text-xl font-bold text-charcoal">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-warmgray">{hint}</div>}
    </div>
  );
}

/** ₩ formatter (won, thousands separators). */
export function fmtMoney(n?: number | null) {
  if (n == null) return "—";
  return "₩" + n.toLocaleString();
}

/** notice banner shown when a page is on sample data. */
export function SampleNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-charcoal">
      {children}
    </div>
  );
}
