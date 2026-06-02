"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  ScanLine,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { Contact, ContactSource } from "@/lib/types";
import { PageHeader, SampleNotice, SourceBadge } from "@/components/ui";
import ConfirmDelete from "@/components/ConfirmDelete";

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SOURCE_LABEL: Record<ContactSource, string> = {
  manual: "manual",
  card: "card scan",
  google: "Google",
};
const SOURCE_CLS: Record<ContactSource, string> = {
  manual: "bg-line text-warmgray",
  card: "bg-coral/12 text-coral-dark",
  google: "bg-sage/15 text-sage",
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-charcoal outline-none focus:border-coral";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-warmgray">
        {label}
      </span>
      {children}
    </label>
  );
}

// ── Contact form modal ────────────────────────────────────────────────────────

interface FormState {
  name: string;
  company: string;
  title: string;
  phones: string; // comma-separated in UI
  emails: string; // comma-separated in UI
  note: string;
  source: ContactSource;
}

function contactToForm(c?: Partial<Contact>): FormState {
  return {
    name: c?.name ?? "",
    company: c?.company ?? "",
    title: c?.title ?? "",
    phones: (c?.phones ?? []).join(", "),
    emails: (c?.emails ?? []).join(", "),
    note: c?.note ?? "",
    source: c?.source ?? "manual",
  };
}

function splitComma(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface ContactFormProps {
  mode: "create" | "edit";
  contact?: Contact;
  prefill?: Partial<Contact>;
  onClose: () => void;
  onSaved: () => void;
}

function ContactForm({ mode, contact, prefill, onClose, onSaved }: ContactFormProps) {
  const initial =
    mode === "edit" && contact ? contactToForm(contact) : contactToForm(prefill);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      title: form.title.trim() || undefined,
      phones: splitComma(form.phones),
      emails: splitComma(form.emails),
      note: form.note.trim() || undefined,
      source: form.source,
    };
    try {
      const url =
        mode === "create" ? "/api/contacts" : `/api/contacts/${contact!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      onSaved();
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
            {mode === "create" ? "New contact" : "Edit contact"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-warmgray hover:text-charcoal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field className="col-span-2" label="Name *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              placeholder="홍길동 / Jane Smith"
              autoFocus
            />
          </Field>
          <Field label="Company">
            <input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className={inputCls}
              placeholder="회사명"
            />
          </Field>
          <Field label="Title / 직함">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="대표 / Manager"
            />
          </Field>
          <Field className="col-span-2" label="Phones (comma-separated)">
            <input
              value={form.phones}
              onChange={(e) => set("phones", e.target.value)}
              className={inputCls}
              placeholder="010-1234-5678, 02-555-1212"
            />
          </Field>
          <Field className="col-span-2" label="Emails (comma-separated)">
            <input
              value={form.emails}
              onChange={(e) => set("emails", e.target.value)}
              className={inputCls}
              placeholder="name@company.com"
            />
          </Field>
          <Field className="col-span-2" label="Note">
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="짧은 메모…"
            />
          </Field>
          <Field label="Source">
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value as ContactSource)}
              className={inputCls}
            >
              <option value="manual">Manual</option>
              <option value="card">Card scan</option>
              <option value="google">Google</option>
            </select>
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-coral-dark">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-warmgray hover:bg-line/60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : mode === "create" ? "Add contact" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Scan card modal ───────────────────────────────────────────────────────────

interface ScanModalProps {
  onClose: () => void;
  onOpenAdd: (prefill?: Partial<Contact>) => void;
}

function ScanModal({ onClose, onOpenAdd }: ScanModalProps) {
  const [status, setStatus] = useState<
    "idle" | "scanning" | "no-config" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("scanning");
    setErrorMsg("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data:...;base64, prefix
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/contacts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();

      if (!data.configured) {
        setStatus("no-config");
        return;
      }
      if (data.error) {
        setStatus("error");
        setErrorMsg(data.error);
        return;
      }

      setStatus("done");
      onClose();
      onOpenAdd({
        name: data.fields?.name,
        company: data.fields?.company,
        phones: data.fields?.phones ?? [],
        emails: data.fields?.emails ?? [],
        source: "card",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(String(err?.message ?? err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-charcoal">
            <ScanLine size={18} className="text-coral" />
            Scan business card
          </h2>
          <button onClick={onClose} className="text-warmgray hover:text-charcoal">
            <X size={18} />
          </button>
        </div>

        {status === "no-config" && (
          <div className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2.5 text-sm text-charcoal">
            <p className="font-medium">Card OCR isn't connected yet.</p>
            <p className="mt-1 text-xs text-warmgray">
              Enable Google Cloud Vision API and set{" "}
              <code className="rounded bg-line px-1">GOOGLE_VISION_API_KEY</code> to use
              photo scanning. You can still add the contact manually.
            </p>
            <button
              onClick={() => { onClose(); onOpenAdd(); }}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              <Plus size={14} /> Add manually
            </button>
          </div>
        )}

        {status === "error" && (
          <p className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral-dark">
            OCR error: {errorMsg}
          </p>
        )}

        {(status === "idle" || status === "scanning" || status === "error") && (
          <>
            <p className="mb-3 text-sm text-warmgray">
              Take or upload a photo of a business card. The text will be extracted and
              pre-filled in the contact form for review.
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-cream py-8 text-sm text-warmgray transition-colors hover:border-coral/50 hover:text-charcoal">
              <ScanLine size={28} className="text-coral/60" />
              {status === "scanning" ? (
                <span className="text-coral">Scanning…</span>
              ) : (
                <span>Click to choose an image</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
                disabled={status === "scanning"}
              />
            </label>
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-warmgray hover:bg-line/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ContactCard ───────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 flex flex-col gap-3">
      {/* Avatar + name row */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/20 text-sm font-semibold text-coral-dark">
          {initials(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-charcoal">{contact.name}</p>
          {(contact.title || contact.company) && (
            <p className="mt-0.5 truncate text-xs text-warmgray">
              {[contact.title, contact.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="space-y-1">
        {contact.phones?.map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-xs text-warmgray">
            <Phone size={11} className="shrink-0" />
            <span>{p}</span>
          </div>
        ))}
        {contact.emails?.map((e) => (
          <div key={e} className="flex items-center gap-1.5 text-xs text-warmgray">
            <Mail size={11} className="shrink-0" />
            <span className="truncate">{e}</span>
          </div>
        ))}
        {contact.company && !contact.title && (
          <div className="flex items-center gap-1.5 text-xs text-warmgray">
            <Building2 size={11} className="shrink-0" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
      </div>

      {/* Footer: source chip + actions */}
      <div className="flex items-center justify-between pt-1">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SOURCE_CLS[contact.source]}`}
        >
          {SOURCE_LABEL[contact.source]}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Edit contact"
            className="rounded-md border border-line p-1.5 text-charcoal hover:bg-line/60"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            title="Delete contact"
            className="rounded-md border border-line p-1.5 text-coral-dark hover:bg-coral/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Contact> | undefined>();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [showScan, setShowScan] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = contacts.filter((c) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    const hay = [c.name, c.company, ...(c.emails ?? [])].join(" ").toLowerCase();
    return hay.includes(needle);
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/contacts/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    load();
  }

  function openScan() {
    setShowScan(true);
  }

  function handleScanOpenAdd(p?: Partial<Contact>) {
    setPrefill(p);
    setShowAdd(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Contacts"
        subtitle="명함 management — your contact book."
        badge={<SourceBadge live={false} sampleLabel="local" />}
        actions={
          <>
            <button
              onClick={openScan}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-warmgray hover:text-charcoal hover:bg-line/40 transition-colors"
            >
              <ScanLine size={15} /> Scan card
            </button>
            <button
              onClick={() => { setPrefill(undefined); setShowAdd(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              <Plus size={16} /> Add contact
            </button>
          </>
        }
      />

      <SampleNotice>
        Contacts are stored in the dashboard and work now.{" "}
        <strong>Google Contacts sync</strong> and{" "}
        <strong>business-card photo OCR</strong> turn on when you enable the People API +
        Cloud Vision.
      </SampleNotice>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
        <Search size={15} className="text-warmgray" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, email…"
          className="w-full bg-transparent text-charcoal outline-none placeholder:text-warmgray"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-warmgray hover:text-charcoal">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <User size={28} className="mx-auto mb-3 text-warmgray/50" />
          <p className="mb-1 text-sm font-medium text-charcoal">
            {contacts.length === 0 ? "No contacts yet." : "No contacts match your search."}
          </p>
          {contacts.length === 0 && (
            <button
              onClick={() => { setPrefill(undefined); setShowAdd(true); }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              <Plus size={16} /> Add contact
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={() => setEditing(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-warmgray">
        {filtered.length} of {contacts.length} shown · stored in the dashboard
      </p>

      {/* Modals */}
      {showScan && (
        <ScanModal
          onClose={() => setShowScan(false)}
          onOpenAdd={handleScanOpenAdd}
        />
      )}

      {showAdd && (
        <ContactForm
          mode="create"
          prefill={prefill}
          onClose={() => { setShowAdd(false); setPrefill(undefined); }}
          onSaved={() => { setShowAdd(false); setPrefill(undefined); load(); }}
        />
      )}

      {editing && (
        <ContactForm
          mode="edit"
          contact={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      <ConfirmDelete
        open={!!deleteTarget}
        itemName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
