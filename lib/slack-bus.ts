// Realtime fan-out bus for inbound Slack events → the dashboard.
//
// LOCAL DEV: a single-process in-memory EventEmitter feeding the SSE endpoint
// (app/api/slack/stream). This gives true sub-second push while you develop.
//
// PRODUCTION (Vercel serverless): functions are short-lived and don't share
// memory across instances, so this in-memory bus does NOT fan out there.
// On deploy, swap publishSlackEvent() to INSERT into Supabase and have the
// dashboard subscribe via Supabase Realtime (same UX, durable + multi-instance).
import { EventEmitter } from "events";
import type { SlackMessage } from "./types";

const g = globalThis as unknown as { __slackBus?: EventEmitter };
const bus = (g.__slackBus ??= new EventEmitter());
bus.setMaxListeners(0);

export function publishSlackEvent(m: Partial<SlackMessage>): void {
  bus.emit("message", m);
}

export function onSlackEvent(fn: (m: Partial<SlackMessage>) => void): () => void {
  bus.on("message", fn);
  return () => { bus.off("message", fn); };
}
