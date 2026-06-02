// LIVE Google Drive adapter.
// Auth options (checked in order):
//   1. GOOGLE_ACCESS_TOKEN  — a short-lived token (handy for quick tests)
//   2. GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN
//      — the durable path; we exchange the refresh token for a fresh access
//        token automatically and cache it in memory until it nears expiry.
// Get a refresh token once with:  node scripts/get-google-token.mjs
import type { FileNode } from "./types";

let cached: { token: string; exp: number } | null = null;

export function driveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ACCESS_TOKEN ||
    (process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN)
  );
}

async function getAccessToken(): Promise<string | null> {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;

  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  if (cached && Date.now() < cached.exp - 60_000) return cached.token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  const tok = await res.json();
  cached = { token: tok.access_token, exp: Date.now() + (tok.expires_in ?? 3600) * 1000 };
  return cached.token;
}

// List sub-folders of a parent (or My Drive root) — for the attach picker and
// the Drive sidebar browser.
export async function listFolders(parentId?: string): Promise<{ id: string; name: string }[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Drive not configured");
  const parent = parentId || "root";
  const q = encodeURIComponent(
    `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const fields = encodeURIComponent("files(id,name)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&orderBy=name`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Drive folders ${parent} failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.files ?? []).map((f: any) => ({ id: f.id, name: f.name }));
}

export async function liveFolderTree(folderId: string): Promise<FileNode[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Drive not configured");

  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    "files(id,name,mimeType,modifiedTime,owners(emailAddress),webViewLink)"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&orderBy=folder,name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Drive list ${folderId} failed: ${res.status} ${await res.text()}`);
  const json = await res.json();

  const nodes: FileNode[] = (json.files ?? []).map((f: any) => {
    const isFolder = f.mimeType === "application/vnd.google-apps.folder";
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime?.slice(0, 10),
      owner: f.owners?.[0]?.emailAddress,
      driveUrl: f.webViewLink,
      source: "drive" as const,
      children: isFolder ? [] : undefined,
    };
  });
  return nodes.sort(
    (a, b) => Number(!!b.children) - Number(!!a.children) || a.name.localeCompare(b.name)
  );
}
