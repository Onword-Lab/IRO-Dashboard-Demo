// LIVE Slack adapter (Web API). Reads channels/messages/threads and posts back.
//   • SLACK_USER_TOKEN (xoxp-…) → posts AS you (preferred)
//   • SLACK_BOT_TOKEN  (xoxb-…) → posts as the IRO bot
// Scopes: channels:read, channels:history, groups:read, groups:history,
//         chat:write, users:read. Real-time later via Events API / Socket Mode.
import type { SlackChannel, SlackMessage } from "./types";

const BASE = "https://slack.com/api";

function token(): string | null {
  return process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN || null;
}
export function slackConfigured(): boolean {
  return !!token();
}

async function call(method: string, params: Record<string, string> = {}, post = false): Promise<any> {
  const t = token();
  if (!t) throw new Error("Slack not configured");
  let url = `${BASE}/${method}`;
  const init: RequestInit = { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" };
  if (post) {
    init.method = "POST";
    (init.headers as Record<string, string>)["Content-Type"] = "application/json; charset=utf-8";
    init.body = JSON.stringify(params);
  } else {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.ok) throw new Error(`Slack ${method} failed: ${json.error}`);
  return json;
}

// Resolve user ids → display names (cached for the process lifetime).
let userCache: Record<string, string> | null = null;
async function userMap(): Promise<Record<string, string>> {
  if (userCache) return userCache;
  try {
    const json = await call("users.list");
    const m: Record<string, string> = {};
    for (const u of json.members ?? []) {
      m[u.id] = u.profile?.display_name || u.real_name || u.name || u.id;
    }
    userCache = m;
    return m;
  } catch {
    return {};
  }
}

function mapMsg(m: any, channel: string, users: Record<string, string>): SlackMessage {
  return {
    ts: m.ts,
    channel,
    userId: m.user || m.bot_id || "system",
    userName: users[m.user] || m.username || m.user || "Unknown",
    text: m.text || "",
    date: new Date(Number(m.ts) * 1000).toISOString(),
    threadTs: m.thread_ts && m.thread_ts !== m.ts ? m.thread_ts : undefined,
    replyCount: m.reply_count,
    reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.name, count: r.count })),
  };
}

export async function listChannels(): Promise<SlackChannel[]> {
  const json = await call("conversations.list", {
    types: "public_channel,private_channel",
    limit: "100",
    exclude_archived: "true",
  });
  return (json.channels ?? [])
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.is_private,
      topic: c.topic?.value || undefined,
      memberCount: c.num_members,
    }))
    .sort((a: SlackChannel, b: SlackChannel) => a.name.localeCompare(b.name));
}

export async function listMessages(channel: string, limit = 30): Promise<SlackMessage[]> {
  const [json, users] = await Promise.all([
    call("conversations.history", { channel, limit: String(limit) }),
    userMap(),
  ]);
  // Slack returns newest-first; reverse to oldest-first for chat display.
  return (json.messages ?? [])
    .map((m: any) => mapMsg(m, channel, users))
    .reverse();
}

export async function listReplies(channel: string, threadTs: string): Promise<SlackMessage[]> {
  const [json, users] = await Promise.all([
    call("conversations.replies", { channel, ts: threadTs }),
    userMap(),
  ]);
  return (json.messages ?? []).map((m: any) => mapMsg(m, channel, users));
}

export async function postMessage(channel: string, text: string, threadTs?: string): Promise<SlackMessage> {
  const params: Record<string, string> = { channel, text };
  if (threadTs) params.thread_ts = threadTs;
  const json = await call("chat.postMessage", params, true);
  const users = await userMap();
  return mapMsg(json.message ?? { ts: json.ts, text, user: "" }, channel, users);
}
