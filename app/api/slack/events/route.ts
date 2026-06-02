// Slack Events API webhook. Slack POSTs here whenever a new message (incl. the
// Hermes agent's reply) appears. We verify the signature, ack within 3s, and
// publish the message to the realtime bus → the dashboard renders it instantly.
//
// Slack app setup: Event Subscriptions → Request URL = https://<deploy>/api/slack/events
// Subscribe to bot events: message.channels, message.groups, message.im, message.mpim.
import { NextResponse } from "next/server";
import { verifySlackSignature } from "@/lib/slack-verify";
import { publishSlackEvent } from "@/lib/slack-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory de-dup of Slack's retries (prod: use Redis/Supabase).
const seen = new Set<string>();

export async function POST(req: Request) {
  const raw = await req.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  // 1) URL verification handshake (when you set the Request URL in Slack).
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // 2) Verify the request is genuinely from Slack.
  const sig = req.headers.get("x-slack-signature");
  const ts = req.headers.get("x-slack-request-timestamp");
  if (!verifySlackSignature(raw, ts, sig)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  // 3) De-dup retries.
  if (body.event_id) {
    if (seen.has(body.event_id)) return NextResponse.json({ ok: true });
    seen.add(body.event_id);
    if (seen.size > 2000) seen.clear();
  }

  // 4) Relay new messages (human OR agent/bot) to the dashboard.
  const e = body.event;
  if (e && e.type === "message" && (e.subtype === undefined || e.subtype === "bot_message") && e.text) {
    publishSlackEvent({
      ts: e.ts,
      channel: e.channel,
      userId: e.user || e.bot_id || "agent",
      userName: e.username || e.user || "Slack",
      text: e.text,
      date: new Date(Number(e.ts) * 1000).toISOString(),
      threadTs: e.thread_ts && e.thread_ts !== e.ts ? e.thread_ts : undefined,
    });
  }

  // 5) Ack fast (<3s) so Slack doesn't retry.
  return NextResponse.json({ ok: true });
}
