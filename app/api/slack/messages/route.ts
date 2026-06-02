import { NextResponse } from "next/server";
import { slackConfigured, listMessages, listReplies, postMessage } from "@/lib/slack";
import { sampleSlackMessages } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET ?channel=<id>            → top-level messages of a channel
// GET ?channel=<id>&thread=<ts> → a thread (parent + replies)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") || "";
  const thread = url.searchParams.get("thread") || "";

  if (slackConfigured()) {
    try {
      const messages = thread ? await listReplies(channel, thread) : await listMessages(channel);
      return NextResponse.json({ configured: true, messages });
    } catch (e) {
      console.error("Slack messages failed, using sample:", e);
    }
  }

  // Sample fallback
  let messages = thread
    ? sampleSlackMessages.filter((m) => m.ts === thread || m.threadTs === thread)
    : sampleSlackMessages.filter((m) => m.channel === channel && !m.threadTs);
  messages = [...messages].sort((a, b) => Number(a.ts) - Number(b.ts));
  return NextResponse.json({ configured: false, messages });
}

// POST { channel, text, threadTs? } → post a message (live) or echo (test mode)
export async function POST(req: Request) {
  const { channel, text, threadTs } = await req.json().catch(() => ({}));
  if (!channel || !text) {
    return NextResponse.json({ error: "channel and text required" }, { status: 400 });
  }

  if (slackConfigured()) {
    try {
      const message = await postMessage(channel, text, threadTs);
      return NextResponse.json({ configured: true, message });
    } catch (e: any) {
      return NextResponse.json({ configured: true, error: String(e?.message ?? e) }, { status: 500 });
    }
  }

  // Test mode: echo back so the UI shows the message locally (NOT sent to Slack).
  const now = new Date();
  const message = {
    ts: `${Math.floor(now.getTime() / 1000)}.${String(now.getMilliseconds()).padStart(4, "0")}`,
    channel,
    userId: "me",
    userName: "나 (테스트)",
    text,
    date: now.toISOString(),
    threadTs: threadTs || undefined,
  };
  return NextResponse.json({ configured: false, message });
}
