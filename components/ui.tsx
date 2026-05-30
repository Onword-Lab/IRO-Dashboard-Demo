import type { ProjectStatus, TaskStatus, Priority, Person } from "@/lib/types";

const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  "Not started": "bg-line text-warmgray",
  "In progress": "bg-coral/15 text-coral-dark",
  Done: "bg-sage/20 text-sage",
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
