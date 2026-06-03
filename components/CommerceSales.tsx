"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import type { SalesDay } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice, KpiCard, fmtMoney } from "./ui";

function net(d: SalesDay): number {
  return d.revenue - d.fee - d.adCost - d.refund;
}

export default function CommerceSales() {
  const [sales, setSales] = useState<SalesDay[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/commerce/sales");
        const data = await res.json();
        setSales(data.sales ?? []);
        setLive(!!data.configured);
      } catch { /* keep */ }
      setLoading(false);
    })();
  }, []);

  const kpi = useMemo(() => {
    const totalRevenue = sales.reduce((s, d) => s + d.revenue, 0);
    const totalFee = sales.reduce((s, d) => s + d.fee, 0);
    const totalAdCost = sales.reduce((s, d) => s + d.adCost, 0);
    const totalNet = sales.reduce((s, d) => s + net(d), 0);
    return { totalRevenue, totalFee, totalAdCost, totalNet };
  }, [sales]);

  const maxRevenue = useMemo(
    () => (sales.length ? Math.max(...sales.map((d) => d.revenue)) : 1),
    [sales]
  );

  const totals = useMemo(() => ({
    orders: sales.reduce((s, d) => s + d.orders, 0),
    revenue: sales.reduce((s, d) => s + d.revenue, 0),
    fee: sales.reduce((s, d) => s + d.fee, 0),
    adCost: sales.reduce((s, d) => s + d.adCost, 0),
    refund: sales.reduce((s, d) => s + d.refund, 0),
    net: sales.reduce((s, d) => s + net(d), 0),
  }), [sales]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Sales"
        subtitle="매출 · 수수료 · 광고비 · 순이익."
        badge={<SourceBadge live={live} />}
      />

      {!live && (
        <SampleNotice>
          샘플 매출이에요. <b>셀러 API</b> 연동 시 마켓별 실매출/정산으로 전환됩니다.
        </SampleNotice>
      )}

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="총매출" value={fmtMoney(kpi.totalRevenue)} />
        <KpiCard label="총수수료" value={fmtMoney(kpi.totalFee)} />
        <KpiCard label="총광고비" value={fmtMoney(kpi.totalAdCost)} />
        <KpiCard
          label="총순이익"
          value={
            <span className={kpi.totalNet >= 0 ? "text-sage" : "text-coral-dark"}>
              {fmtMoney(kpi.totalNet)}
            </span>
          }
        />
      </div>

      {loading ? (
        <p className="px-1 py-6 text-sm text-warmgray">Loading…</p>
      ) : sales.length === 0 ? (
        <p className="px-1 py-6 text-sm text-warmgray">매출 데이터가 없습니다.</p>
      ) : (
        <>
          {/* 일자별 막대 차트 */}
          <div className="mb-5 rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-charcoal">
              <BarChart3 size={14} className="text-warmgray" />
              일자별 매출
            </div>
            <div className="space-y-2">
              {sales.map((d) => {
                const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={d.date} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 font-mono text-warmgray">{d.date}</span>
                    <div className="flex-1">
                      <div
                        className="h-2.5 rounded bg-coral"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right font-mono text-charcoal">
                      {fmtMoney(d.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 일자별 상세 테이블 */}
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-sm font-semibold text-charcoal">
              <TrendingUp size={14} className="text-warmgray" />
              일자별 상세
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-warmgray">
                    <th className="px-4 py-2.5 text-left">날짜</th>
                    <th className="px-3 py-2.5 text-right">주문건수</th>
                    <th className="px-3 py-2.5 text-right">매출액</th>
                    <th className="px-3 py-2.5 text-right">마켓수수료</th>
                    <th className="px-3 py-2.5 text-right">광고비</th>
                    <th className="px-3 py-2.5 text-right">환불액</th>
                    <th className="px-4 py-2.5 text-right">순이익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sales.map((d) => {
                    const n = net(d);
                    return (
                      <tr key={d.date} className="transition-colors hover:bg-cream/40">
                        <td className="px-4 py-2.5 font-mono text-xs text-charcoal">{d.date}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{d.orders}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(d.revenue)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(d.fee)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(d.adCost)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-charcoal">{fmtMoney(d.refund)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${n >= 0 ? "text-sage" : "text-coral-dark"}`}>
                          {fmtMoney(n)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* 합계 row */}
                  <tr className="border-t-2 border-line bg-cream/30">
                    <td className="px-4 py-2.5 text-xs font-bold text-charcoal">합계</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{totals.orders}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(totals.revenue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(totals.fee)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(totals.adCost)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-charcoal">{fmtMoney(totals.refund)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${totals.net >= 0 ? "text-sage" : "text-coral-dark"}`}>
                      {fmtMoney(totals.net)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
