"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, Printer, MessageSquare, ExternalLink } from "lucide-react";
import type { ShippingInfo, ShipStatus } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard } from "./ui";

const STATUS_STYLE: Record<ShipStatus, string> = {
  배송완료: "bg-sage/20 text-sage",
  배송중: "bg-coral/15 text-coral-dark",
  집화: "bg-amber/20 text-amber",
  간선상차: "bg-amber/20 text-amber",
  배송출발: "bg-amber/20 text-amber",
};

type NotifyResult = { configured: false; message: string } | { configured: true; sent: boolean; receiptNum?: string };

export default function CommerceShipping() {
  const [shipping, setShipping] = useState<ShippingInfo[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyNotify, setBusyNotify] = useState<string | null>(null);
  const [notifyResults, setNotifyResults] = useState<Record<string, NotifyResult>>({});
  const [printToast, setPrintToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/commerce/shipping");
        const data = await res.json();
        setShipping(data.shipping ?? []);
        setLive(!!data.configured);
      } catch { /* keep */ }
      setLoading(false);
    })();
  }, []);

  const kpi = useMemo(() => {
    const inTransit = shipping.filter((s) => s.status !== "배송완료").length;
    const done = shipping.filter((s) => s.status === "배송완료").length;
    const total = shipping.length;
    const courierCount = new Set(shipping.map((s) => s.courier)).size;
    return { inTransit, done, total, courierCount };
  }, [shipping]);

  function printInvoices() {
    const pendingCount = shipping.filter((s) => s.status !== "배송완료").length;
    setPrintToast(`송장 ${pendingCount}건 출력 준비됨 (스윗트래커/굿스플로 연동 시 실제 출력)`);
    setTimeout(() => setPrintToast(null), 4000);
  }

  async function sendNotify(o: ShippingInfo) {
    setBusyNotify(o.orderId);
    try {
      const res = await fetch("/api/commerce/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "",
          name: o.recipient,
          content: `[배송안내] ${o.recipient}님, 주문 ${o.orderId} 상품이 ${o.courier} ${o.trackingNo} 로 발송되어 ${o.status} 상태입니다.`,
        }),
      });
      const data: NotifyResult = await res.json();
      setNotifyResults((m) => ({ ...m, [o.orderId]: data }));
    } catch (e) {
      setNotifyResults((m) => ({
        ...m,
        [o.orderId]: { configured: false, message: String(e) },
      }));
    }
    setBusyNotify(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Shipping"
        subtitle="배송 추적 · 송장 — 200개 택배사."
        badge={<SourceBadge live={live} />}
        actions={
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={printInvoices}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-charcoal hover:bg-line/40 transition-colors"
            >
              <Printer size={14} /> 송장 일괄출력
            </button>
            {printToast && (
              <span className="text-[11px] text-warmgray">{printToast}</span>
            )}
          </div>
        }
      />

      {!live && (
        <SampleNotice>
          샘플 배송 데이터예요. <b>스윗트래커/굿스플로</b> 연동 시 실시간 배송추적·송장 일괄출력이 됩니다. 아래{" "}
          <b>배송 알림톡</b>은 팝빌 카카오 연동 설정 시 발송됩니다.
        </SampleNotice>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="배송중" value={<span className="text-coral-dark">{kpi.inTransit}건</span>} hint="미완료 건수" />
        <KpiCard label="배송완료" value={<span className="text-sage">{kpi.done}건</span>} />
        <KpiCard label="전체 건수" value={`${kpi.total}건`} />
        <KpiCard label="택배사 수" value={`${kpi.courierCount}개`} />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <p className="px-4 py-6 text-sm text-warmgray">Loading…</p>
        ) : shipping.length === 0 ? (
          <p className="px-4 py-6 text-sm text-warmgray">배송 정보가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
                  <th className="px-4 py-2.5 text-left">주문번호</th>
                  <th className="px-3 py-2.5 text-left">수령인</th>
                  <th className="px-3 py-2.5 text-left">주소</th>
                  <th className="px-3 py-2.5 text-left">택배사</th>
                  <th className="px-3 py-2.5 text-left">운송장번호</th>
                  <th className="px-3 py-2.5 text-left">발송일</th>
                  <th className="px-3 py-2.5 text-left">상태</th>
                  <th className="px-3 py-2.5 text-left">예상도착</th>
                  <th className="px-4 py-2.5 text-left">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shipping.map((o) => {
                  const result = notifyResults[o.orderId];
                  return (
                    <tr key={o.orderId} className="align-top transition-colors hover:bg-cream/40">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-charcoal">{o.orderId}</span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-charcoal">{o.recipient}</td>
                      <td className="px-3 py-2.5 max-w-[160px]">
                        <span className="block truncate text-xs text-warmgray" title={o.address}>{o.address}</span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-charcoal">{o.courier}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-charcoal">{o.trackingNo}</span>
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center gap-0.5 rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-medium text-warmgray hover:text-charcoal transition-colors"
                          >
                            <ExternalLink size={9} /> 배송조회
                          </a>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-warmgray">{o.shippedAt ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-warmgray">{o.eta ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => sendNotify(o)}
                            disabled={busyNotify === o.orderId}
                            className="flex items-center gap-1 rounded bg-coral/15 px-2 py-1 text-[11px] font-semibold text-coral-dark hover:bg-coral hover:text-white disabled:opacity-40 transition-colors"
                          >
                            <MessageSquare size={11} />
                            {busyNotify === o.orderId ? "발송중…" : "알림톡"}
                          </button>
                          {result && (
                            <div
                              className={`text-[10px] ${
                                result.configured === false ? "text-amber" : "text-sage"
                              }`}
                            >
                              {result.configured === false
                                ? result.message
                                : `발송됨 · ${result.receiptNum ?? ""}`}
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
