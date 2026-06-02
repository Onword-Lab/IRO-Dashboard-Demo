"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Upload, Plus, Pencil, Trash2, X,
} from "lucide-react";
import type { Tx, TxDirection } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "@/components/ui";
import ConfirmDelete from "@/components/ConfirmDelete";

// ── helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-charcoal outline-none focus:border-coral";

function Field({
  label, children, className = "",
}: {
  label: string; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-warmgray">{label}</span>
      {children}
    </label>
  );
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────

interface TxFormProps {
  mode: "create" | "edit";
  tx?: Tx;
  onClose: () => void;
  onSaved: () => void;
}

function TxForm({ mode, tx, onClose, onSaved }: TxFormProps) {
  const [date, setDate] = useState(tx?.date ?? todayISO());
  const [direction, setDirection] = useState<TxDirection>(tx?.direction ?? "in");
  const [counterparty, setCounterparty] = useState(tx?.counterparty ?? "");
  const [amount, setAmount] = useState(tx?.amount != null ? String(tx.amount) : "");
  const [balance, setBalance] = useState(tx?.balance != null ? String(tx.balance) : "");
  const [category, setCategory] = useState(tx?.category ?? "");
  const [memo, setMemo] = useState(tx?.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("Date is required."); return; }
    if (!counterparty.trim()) { setError("Counterparty is required."); return; }
    const amtNum = Number(amount.replace(/[^0-9.-]/g, ""));
    if (!amtNum || amtNum <= 0) { setError("Amount must be a positive number."); return; }

    setSaving(true);
    setError("");
    const payload = {
      date,
      direction,
      counterparty: counterparty.trim(),
      amount: amtNum,
      balance: balance.trim() ? Number(balance.replace(/[^0-9.-]/g, "")) : undefined,
      category: category.trim() || undefined,
      memo: memo.trim() || undefined,
      source: tx?.source ?? "manual",
    };
    try {
      const url = mode === "create" ? "/api/finance" : `/api/finance/${tx!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      onSaved();
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
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
            {mode === "create" ? "새 거래 추가" : "거래 수정"}
          </h2>
          <button type="button" onClick={onClose} className="text-warmgray hover:text-charcoal">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="구분 *">
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as TxDirection)}
              className={inputCls}
            >
              <option value="in">입금 (in)</option>
              <option value="out">출금 (out)</option>
            </select>
          </Field>
          <Field className="col-span-2" label="거래처 (Counterparty) *">
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className={inputCls}
              placeholder="e.g. 안녕 Education"
            />
          </Field>
          <Field label="Amount (₩) *">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
          <Field label="Balance (₩)">
            <input
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={inputCls}
              inputMode="numeric"
              placeholder="잔액 (optional)"
            />
          </Field>
          <Field label="Category">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              placeholder="e.g. 매출, SaaS, 식비"
            />
          </Field>
          <Field label="Memo">
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={inputCls}
              placeholder="optional note"
            />
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
            {saving ? "Saving…" : mode === "create" ? "Add transaction" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Import CSV modal ──────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);

  async function doImport() {
    if (!csv.trim()) { setError("CSV content is empty."); return; }
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/finance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Import failed (${res.status})`);
      setResult(data.created?.length ?? 0);
      onImported();
    } catch (err: unknown) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 p-4 sm:p-8">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-line bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal">CSV Import</h2>
          <button type="button" onClick={onClose} className="text-warmgray hover:text-charcoal">
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs text-warmgray">
          Paste bank CSV below. Expected columns (Korean or English):{" "}
          <code className="rounded bg-line px-1 text-charcoal">거래일시, 적요, 출금, 입금, 잔액</code>
        </p>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-charcoal outline-none focus:border-coral"
          placeholder={"거래일시,적요,출금,입금,잔액\n2026-05-30,안녕 Education,,1200000,8420000"}
        />

        {error && <p className="mt-2 text-sm text-coral-dark">{error}</p>}
        {result !== null && (
          <p className="mt-2 text-sm text-sage">{result}개 행이 추가되었습니다.</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-warmgray hover:bg-line/60"
          >
            Close
          </button>
          <button
            type="button"
            onClick={doImport}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60"
          >
            <Upload size={14} />
            {importing ? "Importing…" : "Parse & import"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function FinanceView() {
  const [txList, setTxList] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [removing, setRemoving] = useState<Tx | null>(null);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance");
      const data = await res.json();
      setTxList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // KPIs: current month only
  const ym = currentYearMonth();
  const kpis = useMemo(() => {
    const thisMonth = txList.filter((t) => t.date.startsWith(ym));
    const totalIn = thisMonth.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const totalOut = thisMonth.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [txList, ym]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Banking"
        subtitle="입출금 ledger — manual entry + bank CSV import."
        badge={<SourceBadge live={false} sampleLabel="local" />}
        actions={
          <>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-charcoal hover:bg-line/50"
            >
              <Upload size={15} /> Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              <Plus size={16} /> Add
            </button>
          </>
        }
      />

      <SampleNotice>
        This ledger is stored in the dashboard and works now.{" "}
        <strong>Automatic bank sync</strong> (CODEF / 오픈뱅킹) and{" "}
        <strong>receipt-photo OCR</strong> come in a later phase.
      </SampleNotice>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          label="이번 달 입금"
          value={<span className="text-sage">{fmtMoney(kpis.totalIn)}</span>}
          hint={ym + " · in"}
        />
        <KpiCard
          label="이번 달 출금"
          value={<span className="text-coral-dark">{fmtMoney(kpis.totalOut)}</span>}
          hint={ym + " · out"}
        />
        <KpiCard
          label="순액 (net)"
          value={
            <span className={kpis.net >= 0 ? "text-sage" : "text-coral-dark"}>
              {kpis.net >= 0 ? "+" : ""}{fmtMoney(kpis.net)}
            </span>
          }
          hint="입금 − 출금"
        />
      </div>

      {/* Ledger table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-warmgray">Loading…</div>
        ) : txList.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="mb-1 text-sm font-medium text-charcoal">No transactions yet.</p>
            <p className="text-sm text-warmgray">Add one manually or import a bank CSV.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wider text-warmgray">
              <tr>
                <Th>Date</Th>
                <Th>구분</Th>
                <Th>거래처</Th>
                <Th>Category</Th>
                <Th>Memo</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Balance</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txList.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-line/30">
                  <td className="px-3 py-2.5 font-mono text-[12px] text-warmgray">{t.date}</td>
                  <td className="px-3 py-2.5">
                    {t.direction === "in" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sage">
                        <ArrowDownLeft size={13} /> 입금
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-coral-dark">
                        <ArrowUpRight size={13} /> 출금
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-charcoal">{t.counterparty}</td>
                  <td className="px-3 py-2.5">
                    {t.category ? (
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-warmgray">
                        {t.category}
                      </span>
                    ) : (
                      <span className="text-warmgray">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-warmgray">{t.memo ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px]">
                    <span className={t.direction === "in" ? "text-sage" : "text-coral-dark"}>
                      {t.direction === "in" ? "+" : "−"}{fmtMoney(t.amount)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-warmgray">
                    {t.balance != null ? fmtMoney(t.balance) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(t); }}
                        title="Edit"
                        className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[12px] text-charcoal hover:bg-line/60"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRemoving(t); }}
                        title="Delete"
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
        )}
      </div>

      {!loading && txList.length > 0 && (
        <p className="mt-3 text-[11px] text-warmgray">
          {txList.length} transactions · stored in dashboard (.data/transactions.json)
        </p>
      )}

      {/* Add modal */}
      {showForm && (
        <TxForm
          mode="create"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <TxForm
          mode="edit"
          tx={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load(); }}
        />
      )}

      {/* Delete guard */}
      <ConfirmDelete
        open={!!removing}
        itemName={removing?.counterparty ?? ""}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          await fetch(`/api/finance/${removing.id}`, { method: "DELETE" });
          setRemoving(null);
          load();
        }}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 font-semibold ${className}`}>{children}</th>;
}
