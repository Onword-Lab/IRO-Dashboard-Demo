"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt, FileText, Search, Building2, CheckCircle2, Clock, ShieldCheck, ShieldAlert, Download, Pencil } from "lucide-react";
import type { TaxInvoice, CashReceipt, IssuerProfile } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "./ui";
import { TaxInvoiceForm, CashbillForm, ProfileForm } from "./TaxForms";

// ── helpers ──────────────────────────────────────────────────────────────────
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtDate(iso: string): string { return iso.slice(0, 10); }
function fmtBizNo(raw?: string): string {
  if (!raw) return "";
  const n = raw.replace(/[^0-9]/g, "");
  return n.length === 10 ? `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}` : raw;
}

function StatusChip({ status }: { status: TaxInvoice["status"] }) {
  if (status === "issued") return <span className="inline-flex items-center gap-1 rounded-full bg-sage/20 px-2 py-0.5 text-[11px] font-medium text-sage"><CheckCircle2 size={10} /> 발행</span>;
  if (status === "sent") return <span className="inline-flex items-center gap-1 rounded-full bg-coral-dark/15 px-2 py-0.5 text-[11px] font-medium text-coral-dark"><Receipt size={10} /> 전송</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[11px] font-medium text-amber"><Clock size={10} /> 임시</span>;
}

// ── BizNo lookup ──────────────────────────────────────────────────────────────
function BizNoLookup() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function lookup() {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/tax/bizno", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bizNo: input.trim() }) });
      setResult(await res.json());
    } catch { setResult({ configured: true, error: "네트워크 오류" }); }
    setLoading(false);
  }
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-charcoal"><Building2 size={14} className="text-warmgray" /> 사업자번호 조회</div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} placeholder="000-00-00000"
          className="h-8 flex-1 rounded-lg border border-line bg-cream px-3 text-sm text-charcoal placeholder:text-warmgray/60 focus:border-coral/50 focus:outline-none" />
        <button onClick={lookup} disabled={loading || !input.trim()} className="flex h-8 items-center gap-1 rounded-lg bg-charcoal px-3 text-xs font-semibold text-cream disabled:opacity-50"><Search size={12} /> 조회</button>
      </div>
      {result && (
        <div className="mt-2 text-xs">
          {!result.configured ? (
            <p className="text-warmgray">무료 <code className="rounded bg-line px-1">DATA_GO_KR_KEY</code> 를 추가하면 실시간 조회가 켜집니다.</p>
          ) : result.error ? (
            <p className="text-coral-dark">오류: {result.error}</p>
          ) : result.result ? (
            <div className="flex flex-wrap gap-3">
              <span><span className="text-warmgray">번호: </span><span className="font-mono text-charcoal">{fmtBizNo(result.result.bizNo)}</span></span>
              <span><span className="text-warmgray">상태: </span><span className="font-semibold text-charcoal">{result.result.status}</span></span>
              {result.result.taxType && <span><span className="text-warmgray">과세유형: </span><span className="text-charcoal">{result.result.taxType}</span></span>}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
type Tab = "sales" | "received" | "cash" | "profile";
type Modal = "invoice" | "cashbill" | "profile" | null;

export default function TaxView() {
  const [profile, setProfile] = useState<IssuerProfile | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]); // 매출
  const [received, setReceived] = useState<TaxInvoice[]>([]); // 매입
  const [cash, setCash] = useState<CashReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("sales");
  const [modal, setModal] = useState<Modal>(null);

  async function load() {
    try {
      const [p, inv, rec, cb] = await Promise.all([
        fetch("/api/tax/profile").then((r) => r.json()),
        fetch("/api/tax/invoices").then((r) => r.json()),
        fetch("/api/tax").then((r) => r.json()),
        fetch("/api/tax/cashbill").then((r) => r.json()),
      ]);
      setProfile(p.profile ?? null);
      setInvoices(inv.invoices ?? []);
      setReceived(rec.received ?? []);
      setCash(cb.cashReceipts ?? []);
    } catch { /* keep */ }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const ym = currentYearMonth();
  const salesVat = useMemo(() => invoices.filter((i) => i.issueDate.startsWith(ym)).reduce((s, i) => s + i.vat, 0), [invoices, ym]);
  const purchaseVat = useMemo(() => received.filter((i) => i.issueDate.startsWith(ym)).reduce((s, i) => s + i.vat, 0), [received, ym]);
  const netVat = salesVat - purchaseVat;

  const onIssued = () => { setModal(null); load(); };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Tax"
        subtitle="세금계산서·현금영수증 셀프 발행 콘솔."
        badge={<SourceBadge live={false} sampleLabel="popbill test" />}
        actions={
          <>
            <button onClick={() => setModal("cashbill")} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-line/40"><Receipt size={13} /> 현금영수증</button>
            <button onClick={() => setModal("invoice")} className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-dark"><FileText size={13} /> 세금계산서 발행</button>
          </>
        }
      />

      <SampleNotice>
        <b>팝빌 테스트(샌드박스) 연동됨</b> — 발행 시 팝빌 테스트베드로 전송되고, 내역은 대시보드에도 저장됩니다.
        본인 팝빌 키(<code className="mx-0.5 rounded bg-line px-1">POPBILL_LINK_ID</code>)를 넣으면 본인 계정으로, <code className="mx-0.5 rounded bg-line px-1">POPBILL_IS_TEST=false</code> 면 실제 국세청으로 발행됩니다. (실발행 시 <b>전자세금용 인증서</b> 1회 등록 필요)
      </SampleNotice>

      {/* 인증서 온보딩 배너 */}
      {profile && !profile.certRegistered && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-charcoal">
          <ShieldAlert size={14} className="shrink-0 text-amber" />
          <span>실발행하려면 <b>전자세금용 인증서</b> 등록이 필요해요. 지금은 테스트 모드라 인증서 없이 바로 발행됩니다.</span>
          <button onClick={() => { setTab("profile"); }} className="ml-auto shrink-0 rounded bg-amber/20 px-2 py-0.5 font-semibold text-amber hover:bg-amber/30">내 정보에서 설정</button>
        </div>
      )}

      {/* KPI */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="이번 달 매출세액" value={<span className="text-sage">{fmtMoney(salesVat)}</span>} hint={`${ym} 발행분`} />
        <KpiCard label="이번 달 매입세액" value={fmtMoney(purchaseVat)} hint={`${ym} 수집분`} />
        <KpiCard label="납부예상세액" value={<span className={netVat >= 0 ? "text-coral-dark" : "text-sage"}>{fmtMoney(netVat)}</span>} hint="매출세액 − 매입세액" />
      </div>

      {/* Tabs */}
      <div className="mb-3 flex items-center gap-1">
        {([["sales", `발행 내역(매출) ${invoices.length}`], ["received", `받은 내역(매입) ${received.length}`], ["cash", `현금영수증 ${cash.length}`], ["profile", "내 정보"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? "bg-charcoal text-cream" : "border border-line bg-surface text-warmgray hover:text-charcoal"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="px-1 py-6 text-sm text-warmgray">Loading…</p>
      ) : tab === "sales" ? (
        <InvoiceTable rows={invoices} emptyText="발행한 세금계산서가 없습니다. 우측 상단 ‘세금계산서 발행’으로 시작하세요." />
      ) : tab === "received" ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] text-warmgray"><Download size={12} /> 홈택스에서 자동 수집된 매입분 (읽기 전용)</p>
          <InvoiceTable rows={received} emptyText="수집된 매입 세금계산서가 없습니다." />
        </div>
      ) : tab === "cash" ? (
        <CashTable rows={cash} />
      ) : (
        <ProfilePanel profile={profile} onEdit={() => setModal("profile")} />
      )}

      {/* Modals */}
      {modal === "invoice" && profile && <TaxInvoiceForm profile={profile} onClose={() => setModal(null)} onIssued={onIssued} />}
      {modal === "cashbill" && <CashbillForm onClose={() => setModal(null)} onIssued={onIssued} />}
      {modal === "profile" && profile && <ProfileForm profile={profile} onClose={() => setModal(null)} onSaved={onIssued} />}
    </div>
  );
}

// ── tables / panels ─────────────────────────────────────────────────────────
function InvoiceTable({ rows, emptyText }: { rows: TaxInvoice[]; emptyText: string }) {
  if (rows.length === 0) return <div className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-warmgray">{emptyText}</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
              <th className="px-4 py-2.5 text-left">발행일</th>
              <th className="px-3 py-2.5 text-left">거래처</th>
              <th className="px-3 py-2.5 text-right">공급가액</th>
              <th className="px-3 py-2.5 text-right">세액</th>
              <th className="px-3 py-2.5 text-right">합계</th>
              <th className="px-3 py-2.5 text-left">상태</th>
              <th className="px-4 py-2.5 text-left">승인번호</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-cream/40">
                <td className="px-4 py-2.5 font-mono text-xs text-charcoal">{fmtDate(inv.issueDate)}</td>
                <td className="px-3 py-2.5">
                  <div className="text-sm font-medium text-charcoal">{inv.partnerName}</div>
                  {inv.partnerBizNo && <div className="font-mono text-[10px] text-warmgray">{fmtBizNo(inv.partnerBizNo)}</div>}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(inv.supplyAmount)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(inv.vat)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(inv.total)}</td>
                <td className="px-3 py-2.5"><StatusChip status={inv.status} /></td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-warmgray">{inv.ntsConfirmNum ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashTable({ rows }: { rows: CashReceipt[] }) {
  if (rows.length === 0) return <div className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-warmgray">발행한 현금영수증이 없습니다.</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
              <th className="px-4 py-2.5 text-left">거래일</th>
              <th className="px-3 py-2.5 text-left">구분</th>
              <th className="px-3 py-2.5 text-left">식별번호</th>
              <th className="px-3 py-2.5 text-right">공급가액</th>
              <th className="px-3 py-2.5 text-right">세액</th>
              <th className="px-3 py-2.5 text-right">합계</th>
              <th className="px-4 py-2.5 text-left">승인번호</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((cr) => (
              <tr key={cr.id} className="transition-colors hover:bg-cream/40">
                <td className="px-4 py-2.5 font-mono text-xs text-charcoal">{cr.tradeDate}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cr.purpose === "소득공제" ? "bg-coral/15 text-coral-dark" : "bg-sage/20 text-sage"}`}>{cr.purpose}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-charcoal">{cr.identityNum}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(cr.supplyAmount)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(cr.vat)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(cr.total)}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-warmgray">{cr.ntsConfirmNum ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfilePanel({ profile, onEdit }: { profile: IssuerProfile | null; onEdit: () => void }) {
  if (!profile) return null;
  const rows: [string, string | undefined][] = [
    ["상호", profile.corpName], ["사업자번호", fmtBizNo(profile.bizNo)], ["대표자", profile.ceoName],
    ["이메일", profile.email], ["업태", profile.bizType], ["종목", profile.bizItem], ["주소", profile.address],
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-charcoal">내 사업자 정보 (공급자)</div>
          <button onClick={onEdit} className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-charcoal hover:bg-line/40"><Pencil size={12} /> 수정</button>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line/60 py-1">
              <dt className="text-warmgray">{k}</dt>
              <dd className="text-charcoal">{v || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3">
          {profile.certRegistered ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sage/15 px-3 py-1.5 text-xs font-medium text-sage"><ShieldCheck size={14} /> 전자세금용 인증서 등록됨 — 실발행 준비 완료</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber"><ShieldAlert size={14} /> 인증서 미등록 — 테스트 모드로 발행 가능 (실발행 시 등록 필요)</span>
          )}
        </div>
      </div>
      <BizNoLookup />
    </div>
  );
}
