"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Project, ProjectType, ProjectStatus } from "@/lib/types";
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/types";

interface Props {
  mode: "create" | "edit";
  project?: Project;
  onClose: () => void;
  onSaved: (p: Project) => void;
}

export default function ProjectForm({ mode, project, onClose, onSaved }: Props) {
  const [name, setName] = useState(project?.name ?? "");
  const [code, setCode] = useState(project?.code ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [type, setType] = useState<ProjectType>(project?.type ?? "Agency");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "Planned");
  const [owner, setOwner] = useState(project?.owner ?? "");
  const [revenue, setRevenue] = useState(project?.revenue != null ? String(project.revenue) : "");
  const [startDate, setStartDate] = useState(project?.startDate ?? "");
  const [endDate, setEndDate] = useState(project?.endDate ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true); setError("");
    const payload = {
      name, code, client, type, status, owner,
      revenue: revenue.trim() === "" ? null : Number(revenue.replace(/[^0-9.-]/g, "")),
      startDate, endDate, description,
    };
    try {
      const url = mode === "create" ? "/api/projects" : `/api/projects/${project!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      onSaved(await res.json());
    } catch (err: any) {
      setError(String(err?.message ?? err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 p-4 sm:p-8">
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-lg rounded-2xl border border-line bg-cream p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal">
            {mode === "create" ? "New project" : "Edit project"}
          </h2>
          <button type="button" onClick={onClose} className="text-warmgray hover:text-charcoal">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field className="col-span-2" label="Project name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. AOC Education Program" autoFocus />
          </Field>
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="26-001" />
          </Field>
          <Field label="Client">
            <input value={client} onChange={(e) => setClient(e.target.value)} className={inputCls} placeholder="Client name" />
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as ProjectType)} className={inputCls}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={inputCls}>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Owner">
            <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls} placeholder="담당자" />
          </Field>
          <Field label="Revenue">
            <input value={revenue} onChange={(e) => setRevenue(e.target.value)} className={inputCls} inputMode="numeric" placeholder="0" />
          </Field>
          <Field label="Start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </Field>
          <Field className="col-span-2" label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Short summary…" />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-coral-dark">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-warmgray hover:bg-line/60">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
            {saving ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-charcoal outline-none focus:border-coral";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-warmgray">{label}</span>
      {children}
    </label>
  );
}
