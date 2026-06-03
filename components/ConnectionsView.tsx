"use client";

import { useEffect, useMemo, useState } from "react";
import { Landmark, CreditCard, Plus, FileText, CheckCircle2, X } from "lucide-react";
import type { BankAccount, BankTxn, IssuerProfile, ConnectionKind } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "./ui";
import { TaxInvoiceForm } from "./TaxForms";

const inputCls = "w-full rounded-lg border border-line bg-cream px-3 py-1.5 text-sm text-charcoal outline-none focus:border-coral";

export default function ConnectionsView() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [profile, setProfile] = useState<IssuerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<"bank" | "card" | "issue" | null>(null);

  async function reload() {
    try {
      const [a, t, p] = await Promise.all([
        fetch("/api/connections").then((r) => r.json()),
        fetch("/api/connections/transactions").then((r) => r.json()),
        fetch("/api/tax/profile").then((r) => r.json()),
      ]);
      setAccounts(a.accounts ?? []);
      setTxns(t.txns ?? []);
      setProfile(p.profile ?? null);
    } catch { /* keep */ }
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const selectedTxns = useMemo(() => txns.filter((t) => selected.has(t.id)), [txns, selected]);
  const selectedSum = selectedTxns.reduce((s, t) => s + t.amount, 0);

  const kpi = useMemo(() => {
    const billable = txns.filter((t) => t.direction === "in" && !t.issuedInvoiceId);
    return {
      conns: accounts.length,
      txns: txns.length,
      billable: billable.length,
      billableSum: billable.reduce((s, t) => s + t.amount, 0),
    };
  }, [accounts, txns]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="연동 (Connections)"
        subtitle="계좌·카드를 등록하면 거래내역이 들어옵니다 — 선택해서 바로 세금계산서 발행."
        badge={<SourceBadge live={false} sampleLabel="mock" />}
        actions={
          <>
            <button onClick={() => setModal("bank")} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-line/40"><Landmark size={13} /> 계좌 등록</button>
            <button onClick={() => setModal("card")} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-line/40"><CreditCard size={13} /> 카드 등록</button>
          </>
        }
      />

      <SampleNotice>
        지금은 <b>mock 데이터</b>예요 — 팝빌 <b>EasyFinBank(계좌조회)</b> 실연동 시 자동 전환됩니다. <b>카드 거래조회는 팝빌 준비중</b>이라 카드는 mock입니다.
      </SampleNotice>

      {/* 등록된 계좌/카드 */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span className={`rounded-lg p-2 ${a.kind === "bank" ? "bg-sage/15 text-sage" : "bg-amber/15 text-amber"}`}>
              {a.kind === "bank" ? <Landmark size={18} /> : <CreditCard size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-charcoal">{a.label}</span>
                {a.kind === "card" && <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[9px] font-medium text-amber">mock·팝빌 준비중</span>}
              </div>
              <div className="font-mono text-[11px] text-warmgray">{a.accountNo}</div>
              {a.holder && <div className="text-[11px] text-warmgray">{a.holder}</div>}
            </div>
          </div>
        ))}
        {accounts.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-warmgray">아직 등록된 계좌·카드가 없어요. 우측 상단에서 등록해 보세요.</div>
        )}
      </div>

      {/* KPI */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="등록 계좌·카드" value={`${kpi.conns}개`} />
        <KpiCard label="거래 건수" value={`${kpi.txns}건`} />
        <KpiCard label="발행 가능(미발행 입금)" value={<span className="text-coral-dark">{kpi.billable}건</span>} />
        <KpiCard label="미발행 입금 합계" value={fmtMoney(kpi.billableSum)} />
      </div>

      {/* 선택 툴바 */}
      <div className="mb-3 flex items-center gap-3">
        <div className="text-sm text-warmgray">선택 <b className="text-charcoal">{selected.size}</b>건 · 합계 <b className="font-mono text-charcoal">{fmtMoney(selectedSum)}</b></div>
        <button
          onClick={() => setModal("issue")}
          disabled={selected.size === 0 || !profile}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-dark disabled:opacity-40"
        >
          <FileText size={13} /> 선택 {selected.size}건으로 세금계산서 발행
        </button>
      </div>

      {/* 거래내역 표 */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <p className="px-4 py-6 text-sm text-warmgray">Loading…</p>
        ) : txns.length === 0 ? (
          <p className="px-4 py-6 text-sm text-warmgray">거래내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
                  <th className="px-3 py-2.5 text-left">선택</th>
                  <th className="px-3 py-2.5 text-left">날짜</th>
                  <th className="px-3 py-2.5 text-left">적요</th>
                  <th className="px-3 py-2.5 text-left">소스</th>
                  <th className="px-3 py-2.5 text-left">구분</th>
                  <th className="px-3 py-2.5 text-right">금액</th>
                  <th className="px-4 py-2.5 text-left">발행상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {txns.map((t) => {
                  const issued = !!t.issuedInvoiceId;
                  return (
                    <tr key={t.id} className={`transition-colors hover:bg-cream/40 ${issued ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" disabled={issued} checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="accent-coral disabled:opacity-30" />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-charcoal">{t.date}</td>
                      <td className="px-3 py-2.5 text-sm text-charcoal">{t.counterparty}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${t.source === "bank" ? "bg-sage/20 text-sage" : "bg-amber/20 text-amber"}`}>
                          {t.source === "bank" ? "계좌" : "카드"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-medium ${t.direction === "in" ? "text-sage" : "text-coral-dark"}`}>{t.direction === "in" ? "입금" : "출금"}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${t.direction === "in" ? "text-sage" : "text-coral-dark"}`}>
                        {t.direction === "in" ? "+" : "−"}{fmtMoney(t.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        {issued ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage"><CheckCircle2 size={11} /> 발행됨</span>
                        ) : (
                          <span className="text-[11px] text-warmgray">미발행</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 등록 모달 */}
      {(modal === "bank" || modal === "card") && (
        <RegisterModal kind={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />
      )}

      {/* 발행 모달 */}
      {modal === "issue" && profile && (
        <TaxInvoiceForm
          profile={profile}
          prefillItems={selectedTxns.map((t) => ({ name: "", qty: 1, unitPrice: Math.round(t.amount / 1.1) }))}
          sourceTxnIds={[...selected]}
          onClose={() => setModal(null)}
          onIssued={() => { setModal(null); setSelected(new Set()); reload(); }}
        />
      )}
    </div>
  );
}

function RegisterModal({ kind, onClose, onDone }: { kind: ConnectionKind; onClose: () => void; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);
  const isBank = kind === "bank";

  async function submit() {
    if (busy || !label.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/connections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label, accountNo, holder }),
      });
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 p-4" onClick={onClose}>
      <div className="my-12 w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-charcoal">{isBank ? "계좌 등록" : "카드 등록"} <span className="ml-1 text-[11px] font-normal text-warmgray">(mock)</span></h3>
          <button onClick={onClose} className="text-warmgray hover:text-charcoal"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-[11px] font-medium text-warmgray">{isBank ? "은행명" : "카드사명"} *</label>
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={isBank ? "예: 국민은행" : "예: 신한카드"} /></div>
          <div><label className="mb-1 block text-[11px] font-medium text-warmgray">{isBank ? "계좌번호" : "카드번호"}</label>
            <input className={inputCls} value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder={isBank ? "123-45-678901" : "****-****-****-1234"} /></div>
          <div><label className="mb-1 block text-[11px] font-medium text-warmgray">예금주/명의</label>
            <input className={inputCls} value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="온워드랩" /></div>
          <p className="rounded-lg bg-amber/10 px-3 py-2 text-[11px] text-charcoal">등록하면 <b>mock 거래내역</b>이 자동으로 생성됩니다. (실연동 시 팝빌이 실제 거래를 가져옵니다.)</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/40">취소</button>
          <button onClick={submit} disabled={busy || !label.trim()} className="flex items-center gap-1 rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"><Plus size={13} /> {busy ? "등록중…" : "등록"}</button>
        </div>
      </div>
    </div>
  );
}
