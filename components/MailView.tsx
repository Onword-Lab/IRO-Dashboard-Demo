"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { MailAccount, MailThread } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice } from "./ui";

type Filter = "all" | MailAccount | "unread";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AccountChip({ account }: { account: MailAccount }) {
  const cls =
    account === "sihoon"
      ? "bg-coral/15 text-coral-dark"
      : "bg-sage/20 text-sage";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {account}
    </span>
  );
}

export default function MailView() {
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mail");
        const data = await res.json();
        setThreads(data.threads ?? []);
        setLive(!!data.configured);
      } catch { /* keep empty */ }
      setLoading(false);
    })();
  }, []);

  const counts = {
    all: threads.length,
    sihoon: threads.filter((t) => t.account === "sihoon").length,
    jinho: threads.filter((t) => t.account === "jinho").length,
    unread: threads.filter((t) => t.unread).length,
  };

  const visible =
    filter === "all"
      ? threads
      : filter === "unread"
      ? threads.filter((t) => t.unread)
      : threads.filter((t) => t.account === filter);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sihoon", label: "Sihoon" },
    { key: "jinho", label: "Jinho" },
    { key: "unread", label: "Unread" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Mail"
        subtitle="Unified inbox across the two work accounts."
        badge={<SourceBadge live={live} />}
      />

      {!live && (
        <SampleNotice>
          Showing <b>sample</b> mail. To go live: enable the <b>Gmail API</b>, then run{" "}
          <code className="mx-1 rounded bg-line px-1">node scripts/get-google-token.mjs</code>{" "}
          (Sihoon) and{" "}
          <code className="mx-1 rounded bg-line px-1">node scripts/get-google-token.mjs --account=jinho</code>{" "}
          (Jinho) and click Allow.
        </SampleNotice>
      )}

      {/* Filter chips */}
      <div className="mb-4 flex items-center gap-2">
        {chips.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-coral text-white"
                : "bg-surface border border-line text-warmgray hover:text-charcoal"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                filter === key ? "bg-white/20 text-white" : "bg-line text-warmgray"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-warmgray">Loading…</p>}
      {!loading && visible.length === 0 && (
        <p className="text-sm text-warmgray">No messages.</p>
      )}

      {visible.length > 0 && (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((t) => (
            <a
              key={t.id}
              href={t.permalink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors"
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0 w-2">
                {t.unread && (
                  <span className="block h-2 w-2 rounded-full bg-coral" />
                )}
              </div>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${t.unread ? "text-charcoal" : "text-warmgray"}`}>
                    {t.fromName}
                  </span>
                  <span className="text-[11px] text-warmgray">{t.fromEmail}</span>
                  <AccountChip account={t.account} />
                  {t.labels?.map((lbl) => (
                    <span
                      key={lbl}
                      className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-warmgray capitalize"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
                <div className={`mt-0.5 text-sm ${t.unread ? "font-medium text-charcoal" : "text-charcoal"}`}>
                  {t.subject}
                </div>
                <div className="mt-0.5 truncate text-xs text-warmgray">{t.snippet}</div>
              </div>

              {/* Date + external link */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[11px] text-warmgray">{fmtDate(t.date)}</span>
                <ExternalLink
                  size={12}
                  className="opacity-0 group-hover:opacity-100 text-warmgray transition-opacity"
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
