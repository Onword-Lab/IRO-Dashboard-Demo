// Gmail adapter — two work accounts (sihoon + jinho).
// Uses the shared Google token helper; see lib/google.ts for auth setup.
// Per-inbox tokens: GMAIL_REFRESH_TOKEN_SIHOON, GMAIL_REFRESH_TOKEN_JINHO.
// Falls back to GOOGLE_REFRESH_TOKEN for sihoon if the specific token is absent.
import type { MailAccount, MailThread } from "./types";
import { googleAccessToken, googleConfigured } from "./google";

export function gmailConfigured(): boolean {
  return (
    googleConfigured("GMAIL_REFRESH_TOKEN_SIHOON") ||
    googleConfigured("GMAIL_REFRESH_TOKEN_JINHO") ||
    googleConfigured("GOOGLE_REFRESH_TOKEN")
  );
}

function refreshFor(account: MailAccount): string | undefined {
  if (account === "sihoon") {
    return process.env.GMAIL_REFRESH_TOKEN_SIHOON || process.env.GOOGLE_REFRESH_TOKEN;
  }
  return process.env.GMAIL_REFRESH_TOKEN_JINHO;
}

// Parse "Name <email@example.com>" or bare "email@example.com".
function parseFrom(raw: string): { fromName: string; fromEmail: string } {
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, "");
    return { fromName: name || match[2].split("@")[0], fromEmail: match[2].trim() };
  }
  const email = raw.trim();
  return { fromName: email.split("@")[0], fromEmail: email };
}

export async function listThreads(account: MailAccount, max = 12): Promise<MailThread[]> {
  const token = await googleAccessToken(refreshFor(account));
  if (!token) return [];

  const base = "https://gmail.googleapis.com/gmail/v1/users/me";
  const listRes = await fetch(
    `${base}/messages?maxResults=${max}&q=in:inbox`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!listRes.ok) throw new Error(`Gmail list failed (${account}): ${listRes.status} ${await listRes.text()}`);
  const listJson = await listRes.json();
  const messages: { id: string }[] = listJson.messages ?? [];

  const threads: MailThread[] = [];
  for (const { id } of messages) {
    try {
      const msgRes = await fetch(
        `${base}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();

      const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

      const { fromName, fromEmail } = parseFrom(get("From"));
      const subject = get("Subject") || "(no subject)";

      // Prefer internalDate (ms since epoch) over the Date header for accuracy.
      let date: string;
      if (msg.internalDate) {
        date = new Date(Number(msg.internalDate)).toISOString();
      } else {
        const raw = get("Date");
        date = raw ? new Date(raw).toISOString() : new Date().toISOString();
      }

      threads.push({
        id,
        account,
        fromName,
        fromEmail,
        subject,
        snippet: msg.snippet ?? "",
        date,
        unread: (msg.labelIds as string[] | undefined)?.includes("UNREAD") ?? false,
        labels: (msg.labelIds as string[] | undefined)
          ?.filter((l) => !["INBOX", "UNREAD", "CATEGORY_PERSONAL"].includes(l))
          .map((l) => l.replace(/^CATEGORY_/, "").replace(/_/g, " ").toLowerCase())
          .filter(Boolean),
        permalink: `https://mail.google.com/mail/u/0/#inbox/${id}`,
      });
    } catch {
      // skip bad messages
    }
  }

  return threads;
}

export async function listAllThreads(): Promise<MailThread[]> {
  const [sihoon, jinho] = await Promise.all([
    listThreads("sihoon"),
    listThreads("jinho"),
  ]);
  return [...sihoon, ...jinho].sort((a, b) => b.date.localeCompare(a.date));
}
