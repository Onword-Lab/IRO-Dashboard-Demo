"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import type { IssuerProfile, CashReceiptPurpose } from "@/lib/types";
import { fmtMoney } from "./ui";
import PartnerPicker from "./PartnerPicker";

const inputCls =
  "w-full rounded-lg border border-line bg-cream px-3 py-1.5 text-sm text-charcoal outline-none focus:border-coral";
const labelCls = "mb-1 block text-[11px] font-medium text-warmgray";

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-xl rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-charcoal">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-warmgray">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-warmgray hover:text-charcoal" aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }

// ── 세금계산서 정발행 ─────────────────────────────────────────────────────────
type Row = { name: string; qty: string; unitPrice: string };

export interface PrefillItem { name?: string; qty?: number; unitPrice?: number; }

export function TaxInvoiceForm({
  profile, onClose, onIssued,
  prefillItems, sourceTxnIds,
}: {
  profile: IssuerProfile;
  onClose: () => void;
  onIssued: () => void;
  prefillItems?: PrefillItem[];
  sourceTxnIds?: string[];
}) {
  const [partnerBizNo, setBizNo] = useState("");
  const [partnerName, setName] = useState("");
  const [partnerCeo, setCeo] = useState("");
  const [partnerEmail, setEmail] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [taxType, setTaxType] = useState<"과세" | "영세" | "면세">("과세");
  const [receiveType, setReceiveType] = useState<"영수" | "청구">("청구");
  const initRows: Row[] = prefillItems && prefillItems.length > 0
    ? prefillItems.map((it) => ({ name: it.name ?? "", qty: String(it.qty ?? 1), unitPrice: String(it.unitPrice ?? "") }))
    : [{ name: "", qty: "1", unitPrice: "" }];
  const [rows, setRows] = useState<Row[]>(initRows);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function savePartner() {
    if (!partnerName.trim() || !partnerBizNo.trim()) {
      setSavedMsg("상호·번호 필요"); setTimeout(() => setSavedMsg(""), 1500); return;
    }
    try {
      await fetch("/api/partners", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: partnerName, bizNo: partnerBizNo, ceoName: partnerCeo, email: partnerEmail }),
      });
      setSavedMsg("저장됨 ✓");
    } catch { setSavedMsg("저장 실패"); }
    setTimeout(() => setSavedMsg(""), 1500);
  }

  const computed = useMemo(() => {
    const lines = rows.map((r) => {
      const supply = Math.round((Number(r.qty) || 0) * (Number(r.unitPrice) || 0));
      const vat = taxType === "과세" ? Math.round(supply * 0.1) : 0;
      return { supply, vat };
    });
    return {
      supply: lines.reduce((s, l) => s + l.supply, 0),
      vat: lines.reduce((s, l) => s + l.vat, 0),
    };
  }, [rows, taxType]);
  const total = computed.supply + computed.vat;

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/tax/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerBizNo, partnerName, partnerCeo, partnerEmail, issueDate, taxType, receiveType,
          items: rows.map((r) => ({ name: r.name, qty: Number(r.qty) || 0, unitPrice: Number(r.unitPrice) || 0 })),
          sourceTxnIds: sourceTxnIds ?? [],
        }),
      });
      onIssued();
    } finally { setBusy(false); }
  }

  return (
    <Modal title="세금계산서 발행 (정발행)" subtitle="공급받는자와 품목만 입력하면 됩니다 — 내 정보는 자동으로 채워져요." onClose={onClose}>
      {/* 공급자 (자동) */}
      <div className="mb-3 rounded-lg border border-line bg-cream/60 px-3 py-2 text-xs">
        <span className="font-semibold text-warmgray">공급자(나): </span>
        <span className="text-charcoal">{profile.corpName ?? "내 사업자"}</span>
        {profile.bizNo && <span className="ml-2 font-mono text-warmgray">{profile.bizNo}</span>}
        <span className="ml-2 rounded bg-line px-1.5 py-0.5 text-[10px] text-warmgray">자동</span>
      </div>

      {/* 거래처 자동완성 */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls + " mb-0"}>거래처 선택 (저장된 거래처를 고르면 아래 칸이 자동으로 채워져요)</label>
          <button type="button" onClick={savePartner} className="flex items-center gap-1 text-[11px] font-medium text-coral-dark hover:underline">
            <Save size={11} /> {savedMsg || "현재 거래처 저장"}
          </button>
        </div>
        <PartnerPicker onPick={(p) => { setBizNo(p.bizNo); setName(p.name); setCeo(p.ceoName ?? ""); setEmail(p.email ?? ""); }} />
      </div>

      {/* 공급받는자 */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div><label className={labelCls}>공급받는자 사업자번호 *</label><input className={inputCls} value={partnerBizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="000-00-00000" /></div>
        <div><label className={labelCls}>상호 *</label><input className={inputCls} value={partnerName} onChange={(e) => setName(e.target.value)} placeholder="거래처명" /></div>
        <div><label className={labelCls}>대표자</label><input className={inputCls} value={partnerCeo} onChange={(e) => setCeo(e.target.value)} /></div>
        <div><label className={labelCls}>이메일</label><input className={inputCls} value={partnerEmail} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" /></div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div><label className={labelCls}>작성일자</label><input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
        <div><label className={labelCls}>과세구분</label>
          <select className={inputCls} value={taxType} onChange={(e) => setTaxType(e.target.value as any)}>
            <option>과세</option><option>영세</option><option>면세</option>
          </select>
        </div>
        <div><label className={labelCls}>영수/청구</label>
          <select className={inputCls} value={receiveType} onChange={(e) => setReceiveType(e.target.value as any)}>
            <option>청구</option><option>영수</option>
          </select>
        </div>
      </div>

      {/* 품목 */}
      <div className="mb-2 flex items-center justify-between">
        <label className={labelCls + " mb-0"}>품목</label>
        <button onClick={() => setRows((rs) => [...rs, { name: "", qty: "1", unitPrice: "" }])} className="flex items-center gap-1 text-[11px] font-medium text-coral-dark hover:underline"><Plus size={12} /> 품목 추가</button>
      </div>
      <div className="mb-3 space-y-1.5">
        {rows.map((r, i) => {
          const supply = Math.round((Number(r.qty) || 0) * (Number(r.unitPrice) || 0));
          return (
            <div key={i} className="flex items-center gap-1.5">
              <input className={inputCls + " flex-[3]"} placeholder="품명" value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} />
              <input className={inputCls + " flex-1 text-right"} placeholder="수량" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} />
              <input className={inputCls + " flex-[2] text-right"} placeholder="단가" value={r.unitPrice} onChange={(e) => setRow(i, { unitPrice: e.target.value })} />
              <span className="w-24 shrink-0 text-right font-mono text-xs text-warmgray">{fmtMoney(supply)}</span>
              <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1} className="text-warmgray hover:text-coral-dark disabled:opacity-30"><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {/* 합계 */}
      <div className="mb-4 flex justify-end gap-4 rounded-lg bg-cream/60 px-3 py-2 text-sm">
        <span className="text-warmgray">공급가액 <b className="ml-1 font-mono text-charcoal">{fmtMoney(computed.supply)}</b></span>
        <span className="text-warmgray">세액 <b className="ml-1 font-mono text-charcoal">{fmtMoney(computed.vat)}</b></span>
        <span className="text-charcoal">합계 <b className="ml-1 font-mono text-coral-dark">{fmtMoney(total)}</b></span>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/40">취소</button>
        <button onClick={submit} disabled={busy || !partnerName.trim() || computed.supply <= 0} className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "발행 중…" : "발행하기"}</button>
      </div>
    </Modal>
  );
}

// ── 현금영수증 ────────────────────────────────────────────────────────────────
export function CashbillForm({ onClose, onIssued }: { onClose: () => void; onIssued: () => void }) {
  const [purpose, setPurpose] = useState<CashReceiptPurpose>("지출증빙");
  const [identityNum, setIdentity] = useState("");
  const [tradeDate, setTradeDate] = useState(today());
  const [supply, setSupply] = useState("");
  const [busy, setBusy] = useState(false);

  const supplyNum = Math.round(Number(supply) || 0);
  const vat = Math.round(supplyNum * 0.1);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/tax/cashbill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, identityNum, tradeDate, supplyAmount: supplyNum }),
      });
      onIssued();
    } finally { setBusy(false); }
  }

  return (
    <Modal title="현금영수증 발행" subtitle="식별번호와 금액만 입력하면 됩니다." onClose={onClose}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div><label className={labelCls}>거래구분</label>
          <select className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value as CashReceiptPurpose)}>
            <option value="지출증빙">지출증빙 (사업자)</option>
            <option value="소득공제">소득공제 (개인)</option>
          </select>
        </div>
        <div><label className={labelCls}>작성일자</label><input type="date" className={inputCls} value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} /></div>
      </div>
      <div className="mb-3">
        <label className={labelCls}>식별번호 ({purpose === "소득공제" ? "휴대폰번호" : "사업자번호"})</label>
        <input className={inputCls} value={identityNum} onChange={(e) => setIdentity(e.target.value)} placeholder={purpose === "소득공제" ? "010-0000-0000" : "000-00-00000"} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div><label className={labelCls}>공급가액</label><input className={inputCls + " text-right"} value={supply} onChange={(e) => setSupply(e.target.value)} placeholder="0" /></div>
        <div><label className={labelCls}>부가세 (자동)</label><input className={inputCls + " text-right"} value={vat.toLocaleString()} readOnly /></div>
        <div><label className={labelCls}>합계 (자동)</label><input className={inputCls + " text-right font-semibold"} value={(supplyNum + vat).toLocaleString()} readOnly /></div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/40">취소</button>
        <button onClick={submit} disabled={busy || supplyNum <= 0 || !identityNum.trim()} className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "발행 중…" : "발행하기"}</button>
      </div>
    </Modal>
  );
}

// ── 내 사업자 정보 ────────────────────────────────────────────────────────────
export function ProfileForm({ profile, onClose, onSaved }: { profile: IssuerProfile; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<IssuerProfile>({ ...profile });
  const [busy, setBusy] = useState(false);
  function set(patch: Partial<IssuerProfile>) { setF((p) => ({ ...p, ...patch })); }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/tax/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <Modal title="내 사업자 정보" subtitle="발행 시 공급자 정보로 자동 사용됩니다." onClose={onClose}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div><label className={labelCls}>상호</label><input className={inputCls} value={f.corpName ?? ""} onChange={(e) => set({ corpName: e.target.value })} /></div>
        <div><label className={labelCls}>사업자번호</label><input className={inputCls} value={f.bizNo ?? ""} onChange={(e) => set({ bizNo: e.target.value })} placeholder="000-00-00000" /></div>
        <div><label className={labelCls}>대표자</label><input className={inputCls} value={f.ceoName ?? ""} onChange={(e) => set({ ceoName: e.target.value })} /></div>
        <div><label className={labelCls}>이메일</label><input className={inputCls} value={f.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></div>
        <div><label className={labelCls}>업태</label><input className={inputCls} value={f.bizType ?? ""} onChange={(e) => set({ bizType: e.target.value })} /></div>
        <div><label className={labelCls}>종목</label><input className={inputCls} value={f.bizItem ?? ""} onChange={(e) => set({ bizItem: e.target.value })} /></div>
        <div className="col-span-2"><label className={labelCls}>주소</label><input className={inputCls} value={f.address ?? ""} onChange={(e) => set({ address: e.target.value })} /></div>
      </div>

      {/* 인증서 (mock) */}
      <label className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-cream/60 px-3 py-2.5 text-xs">
        <input type="checkbox" checked={f.certRegistered} onChange={(e) => set({ certRegistered: e.target.checked })} className="mt-0.5 accent-coral" />
        <span>
          <b className="text-charcoal">전자세금용 공동인증서 등록됨</b>
          <span className="mt-0.5 block text-warmgray">실발행을 켤 때 필요합니다. <b>테스트 모드</b>에선 체크하지 않아도 발행 흐름을 확인할 수 있어요.</span>
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-charcoal hover:bg-line/40">취소</button>
        <button onClick={submit} disabled={busy} className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "저장 중…" : "저장"}</button>
      </div>
    </Modal>
  );
}
