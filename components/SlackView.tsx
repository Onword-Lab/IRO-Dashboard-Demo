"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Lock, Send, RefreshCw, MessageSquare, X } from "lucide-react";
import type { SlackChannel, SlackMessage } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice } from "./ui";

// ── helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 2).toUpperCase() || "?";
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
const COLORS = ["bg-coral/20 text-coral-dark", "bg-sage/25 text-sage", "bg-amber/25 text-amber", "bg-charcoal/10 text-charcoal"];
function colorFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[Math.abs(h)];
}
const EMOJI: Record<string, string> = { rocket: "🚀", "+1": "👍", tada: "🎉", eyes: "👀", fire: "🔥", heart: "❤️", white_check_mark: "✅" };
function emoji(name: string) { return EMOJI[name] ?? `:${name}:`; }

// ── one message row ────────────────────────────────────────────────────────────
function MessageRow({ m, onOpenThread }: { m: SlackMessage; onOpenThread?: (m: SlackMessage) => void }) {
  return (
    <div className="group flex gap-2.5 px-4 py-1.5 hover:bg-cream/40">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${colorFor(m.userId)}`}>
        {initials(m.userName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-charcoal">{m.userName}</span>
          <span className="text-[10px] text-warmgray">{fmtTime(m.date)}</span>
        </div>
        <div className="whitespace-pre-wrap break-words text-sm text-charcoal">{m.text}</div>
        {m.reactions && m.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {m.reactions.map((r) => (
              <span key={r.emoji} className="rounded-full border border-line bg-cream px-1.5 py-0.5 text-[11px] text-charcoal">{emoji(r.emoji)} {r.count}</span>
            ))}
          </div>
        )}
        {onOpenThread && m.replyCount ? (
          <button onClick={() => onOpenThread(m)} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-coral-dark hover:underline">
            <MessageSquare size={11} /> {m.replyCount}개의 답글
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── composer ────────────────────────────────────────────────────────────────
function Composer({ placeholder, onSend, sending }: { placeholder: string; onSend: (text: string) => void; sending: boolean }) {
  const [text, setText] = useState("");
  function submit() {
    const t = text.trim();
    if (!t || sending) return;
    onSend(t);
    setText("");
  }
  return (
    <div className="flex items-end gap-2 border-t border-line bg-surface p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        rows={1}
        placeholder={placeholder}
        className="max-h-28 flex-1 resize-none rounded-lg border border-line bg-cream px-3 py-2 text-sm text-charcoal outline-none focus:border-coral"
      />
      <button onClick={submit} disabled={sending || !text.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coral text-white hover:bg-coral-dark disabled:opacity-40">
        <Send size={15} />
      </button>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SlackView() {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [active, setActive] = useState<SlackChannel | null>(null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [thread, setThread] = useState<SlackMessage | null>(null);
  const [threadMsgs, setThreadMsgs] = useState<SlackMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDown = () => requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });

  // refs so the realtime handler always sees the current channel/thread
  const activeRef = useRef<SlackChannel | null>(null);
  const threadRef = useRef<SlackMessage | null>(null);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { threadRef.current = thread; }, [thread]);

  // Realtime push from the Slack Events webhook (SSE in dev → Supabase Realtime in prod).
  // New messages (incl. the Hermes agent's reply) land here the instant they arrive.
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/slack/stream");
      es.onmessage = (ev) => {
        let m: SlackMessage;
        try { m = JSON.parse(ev.data); } catch { return; }
        const a = activeRef.current;
        const th = threadRef.current;
        if (th && (m.threadTs === th.ts || m.ts === th.ts)) {
          setThreadMsgs((t) => (t.some((x) => x.ts === m.ts) ? t : [...t, m]));
        }
        if (a && m.channel === a.id && !m.threadTs) {
          setMessages((p) => (p.some((x) => x.ts === m.ts) ? p : [...p, m]));
          scrollDown();
        }
      };
    } catch { /* SSE unsupported */ }
    return () => { es?.close(); };
  }, []);

  // load channels once
  useEffect(() => {
    (async () => {
      try {
        const d = await fetch("/api/slack/channels").then((r) => r.json());
        setChannels(d.channels ?? []);
        setLive(!!d.configured);
        const pick = (d.channels ?? []).find((c: SlackChannel) => c.name === "iro-dev") ?? d.channels?.[0] ?? null;
        setActive(pick);
      } catch { /* keep */ }
      setLoading(false);
    })();
  }, []);

  async function loadMessages(ch: SlackChannel) {
    const d = await fetch(`/api/slack/messages?channel=${ch.id}`).then((r) => r.json());
    setMessages(d.messages ?? []);
    setLive(!!d.configured);
    scrollDown();
  }
  // load messages when channel changes
  useEffect(() => { if (active) { setThread(null); loadMessages(active); } /* eslint-disable-next-line */ }, [active?.id]);

  async function openThread(m: SlackMessage) {
    setThread(m);
    const d = await fetch(`/api/slack/messages?channel=${m.channel}&thread=${m.ts}`).then((r) => r.json());
    setThreadMsgs(d.messages ?? []);
  }

  async function send(text: string, toThread: boolean) {
    if (!active) return;
    setSending(true);
    try {
      const body = { channel: active.id, text, threadTs: toThread && thread ? thread.ts : undefined };
      const d = await fetch("/api/slack/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
      const msg: SlackMessage = d.message;
      if (toThread) setThreadMsgs((t) => [...t, msg]);
      else { setMessages((m) => [...m, msg]); scrollDown(); }
    } finally { setSending(false); }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Slack"
        subtitle="워크스페이스 채널·스레드를 보고, 여기서 바로 메시지를 보냅니다."
        badge={<SourceBadge live={live} />}
        actions={
          <button onClick={() => active && loadMessages(active)} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-line/40">
            <RefreshCw size={13} /> 새로고침
          </button>
        }
      />

      {!live && (
        <SampleNotice>
          <b>샘플 워크스페이스</b>예요. 라이브 연결: Slack 앱 생성 → 스코프(<code className="rounded bg-line px-1">channels:read/history</code>, <code className="rounded bg-line px-1">chat:write</code>, <code className="rounded bg-line px-1">users:read</code>) 추가 → 설치 후
          <code className="mx-1 rounded bg-line px-1">SLACK_USER_TOKEN</code>(나로 전송) 또는 <code className="mx-1 rounded bg-line px-1">SLACK_BOT_TOKEN</code>(봇으로 전송)을 <code className="mx-1 rounded bg-line px-1">.env.local</code>에 추가하세요. 지금 보내는 메시지는 <b>로컬에만</b> 표시되고 Slack으로 전송되지 않습니다.
        </SampleNotice>
      )}

      <div className="flex h-[calc(100vh-15rem)] min-h-[420px] overflow-hidden rounded-xl border border-line bg-surface">
        {/* channels */}
        <div className="w-52 shrink-0 overflow-y-auto border-r border-line p-2">
          <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-warmgray">채널</div>
          {loading && <p className="px-2 py-2 text-xs text-warmgray">로딩…</p>}
          {channels.map((c) => {
            const on = active?.id === c.id;
            return (
              <button key={c.id} onClick={() => setActive(c)}
                className={`mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm ${on ? "bg-coral/15 text-coral-dark" : "text-charcoal hover:bg-line/50"}`}>
                {c.isPrivate ? <Lock size={13} className="shrink-0 text-warmgray" /> : <Hash size={13} className="shrink-0 text-warmgray" />}
                <span className="flex-1 truncate font-medium">{c.name}</span>
                {c.unread ? <span className="rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">{c.unread}</span> : null}
              </button>
            );
          })}
        </div>

        {/* messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          {active && (
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <Hash size={15} className="text-warmgray" />
              <span className="text-sm font-semibold text-charcoal">{active.name}</span>
              {active.topic && <span className="truncate text-xs text-warmgray">· {active.topic}</span>}
              {active.memberCount != null && <span className="ml-auto text-[11px] text-warmgray">멤버 {active.memberCount}</span>}
            </div>
          )}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
            {messages.length === 0 && !loading && <p className="px-4 py-6 text-sm text-warmgray">메시지가 없습니다.</p>}
            {messages.map((m) => <MessageRow key={m.ts} m={m} onOpenThread={openThread} />)}
          </div>
          {active && <Composer placeholder={`#${active.name}에 메시지 보내기`} onSend={(t) => send(t, false)} sending={sending} />}
        </div>

        {/* thread drawer */}
        {thread && (
          <div className="flex w-80 shrink-0 flex-col border-l border-line">
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <span className="text-sm font-semibold text-charcoal">스레드</span>
              <button onClick={() => setThread(null)} className="text-warmgray hover:text-charcoal"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {threadMsgs.map((m, i) => (
                <div key={m.ts} className={i === 0 ? "border-b border-line pb-1" : ""}>
                  <MessageRow m={m} />
                </div>
              ))}
            </div>
            <Composer placeholder="스레드에 답글…" onSend={(t) => send(t, true)} sending={sending} />
          </div>
        )}
      </div>
    </div>
  );
}
