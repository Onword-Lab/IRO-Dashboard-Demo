"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Receipt, FileText, CheckCircle2 } from "lucide-react";
import type { CommerceOrder, OrderStatus, Market } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "./ui";

const MARKET_STYLE: Record<Market, string> = {
  스마트스토어: "bg-sage/20 text-sage",
  쿠팡: "bg-coral/15 text-coral-dark",
  "11번가": "bg-amber/20 text-amber",
  자사몰: "bg-charcoal/10 text-charcoal",
};
const STATUS_STYLE: Record<OrderStatus, string> = {
  결제완료: "bg-line text-warmgray",
  상품준비중: "bg-amber/20 text-amber",
  배송중: "bg-coral/15 text-coral-dark",
  배송완료: "bg-sage/20 text-sage",
  취소: "bg-charcoal/10 text-warmgray line-through",
  반품: "bg-charcoal/10 text-warmgray line-through",
};

type Issued = { type: "현금영수증" | "세금계산서"; num?: string; err?: string };

export default function CommerceOrders() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<Market | "전체">("전체");
  const [status, setStatus] = useState<OrderStatus | "전체">("전체");
  const [busy, setBusy] = useState<string | null>(null);
  const [issued, setIssued] = useState<Record<string, Issued>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/commerce/orders");
        const data = await res.json();
        setOrders(data.orders ?? []);
        setLive(!!data.configured);
      } catch { /* keep */ }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => orders.filter((o) => (market === "전체" || o.market === market) && (status === "전체" || o.status === status)),
    [orders, market, status]
  );

  const kpi = useMemo(() => {
    const total = orders.length;
    const prep = orders.filter((o) => o.status === "결제완료" || o.status === "상품준비중").length;
    const shipping = orders.filter((o) => o.status === "배송중").length;
    const canceled = orders.filter((o) => o.status === "취소" || o.status === "반품").length;
    const amount = orders.filter((o) => o.status !== "취소" && o.status !== "반품").reduce((s, o) => s + o.amount, 0);
    return { total, prep, shipping, canceled, amount };
  }, [orders]);

  async function issueCashbill(o: CommerceOrder) {
    setBusy(o.id + "-cb");
    try {
      const supply = Math.round(o.amount / 1.1);
      const res = await fetch("/api/tax/cashbill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "소득공제", identityNum: o.phone, supplyAmount: supply }),
      });
      const d = await res.json();
      setIssued((m) => ({ ...m, [o.id]: { type: "현금영수증", num: d.ntsConfirmNum } }));
    } catch (e) {
      setIssued((m) => ({ ...m, [o.id]: { type: "현금영수증", err: String(e) } }));
    }
    setBusy(null);
  }

  async function issueInvoice(o: CommerceOrder) {
    setBusy(o.id + "-ti");
    try {
      const res = await fetch("/api/tax/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: o.buyer, taxType: "과세",
          items: [{ name: o.productName, qty: o.qty, unitPrice: o.unitPrice }],
        }),
      });
      const d = await res.json();
      setIssued((m) => ({ ...m, [o.id]: { type: "세금계산서", num: d.ntsConfirmNum } }));
    } catch (e) {
      setIssued((m) => ({ ...m, [o.id]: { type: "세금계산서", err: String(e) } }));
    }
    setBusy(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Orders"
        subtitle="마켓 통합 주문 — 스마트스토어 · 쿠팡 · 11번가 · 자사몰."
        badge={<SourceBadge live={live} />}
      />
      {!live && (
        <SampleNotice>
          샘플 주문이에요. <b>셀러 API</b>(스마트스토어/쿠팡/11번가/자사몰) 연동 또는 <b>엑셀 업로드</b> 시 실데이터로 전환됩니다.
          아래 <b>현금영수증/세금계산서 발행</b> 버튼은 <b>이미 연결된 팝빌</b>로 실제 동작합니다.
        </SampleNotice>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="총 주문" value={`${kpi.total}건`} />
        <KpiCard label="준비 필요" value={<span className="text-amber">{kpi.prep}건</span>} hint="결제완료+준비중" />
        <KpiCard label="배송중" value={<span className="text-coral-dark">{kpi.shipping}건</span>} />
        <KpiCard label="취소·반품" value={`${kpi.canceled}건`} />
        <KpiCard label="결제금액 합계" value={fmtMoney(kpi.amount)} hint="취소·반품 제외" />
      </div>

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(["전체", "스마트스토어", "쿠팡", "11번가", "자사몰"] as const).map((m) => (
          <button key={m} onClick={() => setMarket(m)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${market === m ? "bg-charcoal text-cream" : "border border-line bg-surface text-warmgray hover:text-charcoal"}`}>
            {m}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        {(["전체", "결제완료", "상품준비중", "배송중", "배송완료", "취소", "반품"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${status === s ? "bg-coral text-white" : "border border-line bg-surface text-warmgray hover:text-charcoal"}`}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-warmgray">{filtered.length}건</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <p className="px-4 py-6 text-sm text-warmgray">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-warmgray">주문이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
                  <th className="px-4 py-2.5 text-left">주문번호</th>
                  <th className="px-3 py-2.5 text-left">마켓</th>
                  <th className="px-3 py-2.5 text-left">상품</th>
                  <th className="px-3 py-2.5 text-right">수량</th>
                  <th className="px-3 py-2.5 text-right">결제금액</th>
                  <th className="px-3 py-2.5 text-left">주문자</th>
                  <th className="px-3 py-2.5 text-left">상태</th>
                  <th className="px-4 py-2.5 text-left">발행</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => {
                  const r = issued[o.id];
                  return (
                    <tr key={o.id} className="align-top transition-colors hover:bg-cream/40">
                      <td className="px-4 py-2.5">
                        <div className="font-mono text-xs text-charcoal">{o.id}</div>
                        <div className="text-[10px] text-warmgray">{o.orderedAt}</div>
                      </td>
                      <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${MARKET_STYLE[o.market]}`}>{o.market}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="text-sm text-charcoal">{o.productName}</div>
                        <div className="text-[10px] text-warmgray">{o.option}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{o.qty}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-charcoal">{fmtMoney(o.amount)}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-sm text-charcoal">{o.buyer}</div>
                        <div className="font-mono text-[10px] text-warmgray">{o.phone}</div>
                      </td>
                      <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[o.status]}`}>{o.status}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button onClick={() => issueCashbill(o)} disabled={!!busy}
                              className="flex items-center gap-1 rounded bg-coral/15 px-2 py-1 text-[11px] font-semibold text-coral-dark hover:bg-coral hover:text-white disabled:opacity-40">
                              <Receipt size={11} /> {busy === o.id + "-cb" ? "발행중…" : "현금영수증"}
                            </button>
                            <button onClick={() => issueInvoice(o)} disabled={!!busy}
                              className="flex items-center gap-1 rounded border border-line px-2 py-1 text-[11px] font-medium text-charcoal hover:bg-line/40 disabled:opacity-40">
                              <FileText size={11} /> {busy === o.id + "-ti" ? "발행중…" : "세금계산서"}
                            </button>
                          </div>
                          {r && (
                            <div className="flex items-center gap-1 text-[10px] text-sage">
                              <CheckCircle2 size={10} /> {r.type} {r.num ? `· ${r.num}` : r.err ? "실패" : "발행됨"}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
