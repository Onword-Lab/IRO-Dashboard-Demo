"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, AlertTriangle, Bell } from "lucide-react";
import type { InventoryItem, StockStatus } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "./ui";

function statusOf(it: InventoryItem): StockStatus {
  if (it.stock <= 0) return "품절";
  if (it.stock < it.safetyStock) return "부족";
  return "정상";
}

const STATUS_STYLE: Record<StockStatus, string> = {
  정상: "bg-sage/20 text-sage",
  부족: "bg-amber/20 text-amber",
  품절: "bg-coral-dark/15 text-coral-dark",
};

type NotifyResult = { configured: false; message: string } | { configured: true; sent: true; receiptNum?: string };

export default function CommerceInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StockStatus | "전체">("전체");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, NotifyResult>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/commerce/inventory");
        const data = await res.json();
        setInventory(data.inventory ?? []);
        setLive(!!data.configured);
      } catch { /* keep */ }
      setLoading(false);
    })();
  }, []);

  const withStatus = useMemo(
    () => inventory.map((it) => ({ ...it, _status: statusOf(it) as StockStatus })),
    [inventory]
  );

  const filtered = useMemo(
    () => withStatus.filter((it) => filter === "전체" || it._status === filter),
    [withStatus, filter]
  );

  const kpi = useMemo(() => {
    const totalSku = withStatus.length;
    const shortage = withStatus.filter((it) => it._status === "부족").length;
    const outOfStock = withStatus.filter((it) => it._status === "품절").length;
    const asset = withStatus.reduce((s, it) => s + it.stock * it.costPrice, 0);
    return { totalSku, shortage, outOfStock, asset };
  }, [withStatus]);

  async function notifyOne(it: InventoryItem): Promise<NotifyResult> {
    const res = await fetch("/api/commerce/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `[재고부족] ${it.productName} 재고 ${it.stock}개 (안전재고 ${it.safetyStock})`,
      }),
    });
    return res.json();
  }

  async function handleNotify(it: InventoryItem) {
    setBusy((b) => ({ ...b, [it.sku]: true }));
    try {
      const r = await notifyOne(it);
      setResults((m) => ({ ...m, [it.sku]: r }));
    } catch { /* keep */ }
    setBusy((b) => ({ ...b, [it.sku]: false }));
  }

  async function notifyAllLow() {
    const lowItems = withStatus.filter((it) => it._status === "부족" || it._status === "품절");
    if (lowItems.length === 0) return;
    const allBusy: Record<string, boolean> = {};
    lowItems.forEach((it) => { allBusy[it.sku] = true; });
    setBusy((b) => ({ ...b, ...allBusy }));
    try {
      const first = await notifyOne(lowItems[0]);
      setToast(!first.configured ? first.message : `${lowItems.length}건 알림 발송됨`);
      const rest = await Promise.allSettled(lowItems.slice(1).map(notifyOne));
      const newResults: Record<string, NotifyResult> = { [lowItems[0].sku]: first };
      rest.forEach((r, i) => {
        if (r.status === "fulfilled") newResults[lowItems[i + 1].sku] = r.value;
      });
      setResults((m) => ({ ...m, ...newResults }));
    } catch { /* keep */ }
    const clearedBusy: Record<string, boolean> = {};
    lowItems.forEach((it) => { clearedBusy[it.sku] = false; });
    setBusy((b) => ({ ...b, ...clearedBusy }));
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Inventory"
        subtitle="재고 · 안전재고 — 부족/품절 자동 표시."
        badge={<SourceBadge live={live} />}
        actions={
          <button
            onClick={notifyAllLow}
            className="flex items-center gap-1.5 rounded-lg bg-amber/20 px-3 py-1.5 text-xs font-semibold text-amber hover:bg-amber/30 transition-colors"
          >
            <Bell size={13} /> 부족 전체 알림
          </button>
        }
      />

      {!live && (
        <SampleNotice>
          샘플 재고예요. <b>셀러 API</b> 연동 시 실시간 재고로 전환됩니다. <b>재고부족 알림</b>은 팝빌 카카오 연동 설정 시 발송됩니다.
        </SampleNotice>
      )}

      {toast && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-charcoal">
          {toast}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="총 SKU" value={`${kpi.totalSku}종`} />
        <KpiCard label="부족" value={<span className="text-amber">{kpi.shortage}종</span>} hint="안전재고 미달" />
        <KpiCard label="품절" value={<span className="text-coral-dark">{kpi.outOfStock}종</span>} hint="재고 0" />
        <KpiCard label="재고자산" value={fmtMoney(kpi.asset)} hint="현재고 × 매입가" />
      </div>

      {/* filter chips */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(["전체", "정상", "부족", "품절"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-charcoal text-cream"
                : "border border-line bg-surface text-warmgray hover:text-charcoal"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-warmgray">{filtered.length}종</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <p className="px-4 py-6 text-sm text-warmgray">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-warmgray">재고 항목이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
                  <th className="px-4 py-2.5 text-left">SKU</th>
                  <th className="px-3 py-2.5 text-left">상품</th>
                  <th className="px-3 py-2.5 text-right">현재고</th>
                  <th className="px-3 py-2.5 text-right">안전재고</th>
                  <th className="px-3 py-2.5 text-right">입고예정</th>
                  <th className="px-3 py-2.5 text-right">매입가</th>
                  <th className="px-3 py-2.5 text-right">판매가</th>
                  <th className="px-3 py-2.5 text-left">상태</th>
                  <th className="px-4 py-2.5 text-left">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((it) => {
                  const st = it._status;
                  const isLow = st === "부족" || st === "품절";
                  const r = results[it.sku];
                  return (
                    <tr key={it.sku} className="align-top transition-colors hover:bg-cream/40">
                      <td className="px-4 py-2.5 font-mono text-xs text-charcoal">{it.sku}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-sm text-charcoal">{it.productName}</div>
                        {it.option && <div className="text-[10px] text-warmgray">{it.option}</div>}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${isLow ? "text-coral-dark" : "text-charcoal"}`}>
                        {it.stock}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{it.safetyStock}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">
                        {it.incoming != null ? it.incoming : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(it.costPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(it.salePrice)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[st]}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          {isLow && (
                            <button
                              onClick={() => handleNotify(it)}
                              disabled={!!busy[it.sku]}
                              className="flex items-center gap-1 rounded bg-amber/20 px-2 py-1 text-[11px] font-semibold text-amber hover:bg-amber/30 disabled:opacity-40 transition-colors"
                            >
                              <AlertTriangle size={11} />
                              {busy[it.sku] ? "발송중…" : "알림"}
                            </button>
                          )}
                          {!isLow && (
                            <span className="flex items-center gap-1 text-[11px] text-warmgray">
                              <Package size={11} /> 정상
                            </span>
                          )}
                          {r && (
                            <div className={`text-[10px] ${!r.configured ? "text-amber" : "text-sage"}`}>
                              {!r.configured ? r.message : "발송됨"}
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
