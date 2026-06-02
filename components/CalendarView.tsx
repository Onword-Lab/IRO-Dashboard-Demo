"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Users, ExternalLink, Clock } from "lucide-react";
import type { CalEvent } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice } from "./ui";

function dayKey(iso: string) { return iso.slice(0, 10); }
function fmtDayLabel(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(e: CalEvent) {
  if (e.allDay) return "All day";
  const s = new Date(e.start);
  const t = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return t;
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        setEvents(data.events ?? []);
        setLive(!!data.configured);
      } catch { /* keep empty */ }
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of [...events].sort((a, b) => a.start.localeCompare(b.start))) {
      const k = dayKey(e.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return [...map.entries()];
  }, [events]);

  const eventDays = useMemo(() => new Set(events.map((e) => dayKey(e.start))), [events]);

  // mini month grid for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  const cellKey = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Calendar"
        subtitle="Your team's upcoming events, in one place."
        badge={<SourceBadge live={live} />}
      />
      {!live && (
        <SampleNotice>
          Showing <b>sample</b> events. To go live: enable the <b>Google Calendar API</b>, then run
          <code className="mx-1 rounded bg-line px-1">node scripts/get-google-token.mjs</code> and click Allow.
        </SampleNotice>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* Agenda */}
        <div>
          {loading && <p className="text-sm text-warmgray">Loading…</p>}
          {!loading && groups.length === 0 && <p className="text-sm text-warmgray">No upcoming events.</p>}
          <div className="space-y-5">
            {groups.map(([key, evs]) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warmgray">{fmtDayLabel(key)}</div>
                <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {evs.map((e) => (
                    <div key={e.id} className="group flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 flex w-16 shrink-0 items-center gap-1 text-xs font-medium text-coral-dark">
                        <Clock size={12} /> {fmtTime(e)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-charcoal">{e.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-warmgray">
                          {e.location && <span className="flex items-center gap-1"><MapPin size={11} />{e.location}</span>}
                          {e.attendees && e.attendees.length > 0 && (
                            <span className="flex items-center gap-1"><Users size={11} />{e.attendees.slice(0, 3).join(", ")}{e.attendees.length > 3 ? ` +${e.attendees.length - 3}` : ""}</span>
                          )}
                          {e.calendar && <span className="rounded bg-line px-1.5 py-0.5">{e.calendar}</span>}
                        </div>
                      </div>
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noreferrer"
                          className="shrink-0 text-warmgray opacity-0 transition-opacity hover:text-charcoal group-hover:opacity-100">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini month */}
        <div className="h-fit rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 text-sm font-semibold text-charcoal">
            {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-warmgray">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const k = cellKey(d);
              const has = eventDays.has(k);
              const isToday = d === today.getDate();
              return (
                <div key={i} className={`relative rounded py-1 text-xs ${isToday ? "bg-coral text-white font-semibold" : "text-charcoal"}`}>
                  {d}
                  {has && !isToday && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-coral" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
