"use client";

// 🔒 Global delete guard — enforces the team rule "삭제 시 허락받아야 되도록".
// EVERY delete in IRO routes through this. For high-value items pass
// requireTyping so the user must type the item name to enable the button.
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDelete({
  open, itemName, requireTyping = false, onCancel, onConfirm,
}: {
  open: boolean;
  itemName: string;
  requireTyping?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const canDelete = !requireTyping || typed.trim() === itemName.trim();

  async function go() {
    if (!canDelete || busy) return;
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-coral/15 p-1.5 text-coral-dark"><AlertTriangle size={16} /></span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-charcoal">Delete “{itemName}”?</h3>
            <p className="mt-1 text-xs text-warmgray">This can’t be undone. Per the team rule, deletes need explicit confirmation.</p>
          </div>
          <button onClick={onCancel} className="text-warmgray hover:text-charcoal" aria-label="Close"><X size={16} /></button>
        </div>
        {requireTyping && (
          <div className="mb-3">
            <label className="mb-1 block text-[11px] text-warmgray">Type <b className="text-charcoal">{itemName}</b> to confirm</label>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus
              className="w-full rounded-md border border-line bg-cream px-3 py-1.5 text-sm text-charcoal outline-none focus:border-coral" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/40">Cancel</button>
          <button onClick={go} disabled={!canDelete || busy}
            className="rounded-md bg-coral px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
