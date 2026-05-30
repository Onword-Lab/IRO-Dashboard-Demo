#!/usr/bin/env node
// One-time Google OAuth helper → prints a Drive refresh token for IRO.
//
//   node scripts/get-google-token.mjs
//
// Prereq: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in iro/.env.local
// (from a Google Cloud "Desktop app" OAuth client, Drive API enabled).
// Desktop clients allow loopback redirects, so no redirect URI registration
// is needed beyond what Google grants automatically.
import http from "node:http";
import { exec } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(path.join(ROOT, f), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
}
loadEnv();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = Number(process.env.GOOGLE_OAUTH_PORT || 53682);
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("✗ Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. Add them to iro/.env.local first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  }).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith("/oauth2callback")) { res.writeHead(404); res.end(); return; }
  const url = new URL(req.url, REDIRECT);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (err || !code) {
    res.end(`Auth error: ${err || "no code"}. You can close this tab.`);
    console.error("✗", err || "no code returned");
    server.close(); process.exit(1);
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT, grant_type: "authorization_code",
      }),
    });
    const tok = await tokenRes.json();
    if (!tok.refresh_token) {
      res.end("No refresh_token returned — revoke prior access and retry. You can close this tab.");
      console.error("✗ No refresh_token in response:", tok);
      server.close(); process.exit(1);
    }
    // Save straight into .env.local so the secret never has to be copy-pasted.
    const envPath = path.join(ROOT, ".env.local");
    let env = "";
    try { env = readFileSync(envPath, "utf8"); } catch {}
    const re = /^GOOGLE_REFRESH_TOKEN=.*$/m;
    env = re.test(env)
      ? env.replace(re, `GOOGLE_REFRESH_TOKEN=${tok.refresh_token}`)
      : (env === "" || env.endsWith("\n") ? env : env + "\n") + `GOOGLE_REFRESH_TOKEN=${tok.refresh_token}\n`;
    writeFileSync(envPath, env);
    res.end("✓ Success! Refresh token saved to .env.local — return to your terminal. You can close this tab.");
    const t = tok.refresh_token;
    console.log(`\n✓ Saved GOOGLE_REFRESH_TOKEN (${t.slice(0, 6)}…${t.slice(-4)}) to iro/.env.local`);
    console.log("Next:  npm run dev   → the top bar should show  Drive: live\n");
    server.close(); process.exit(0);
  } catch (e) {
    res.end("Token exchange failed — see terminal.");
    console.error("✗ Token exchange failed:", e);
    server.close(); process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("\nIRO · Google Drive OAuth helper");
  console.log("Redirect URI (loopback, auto-allowed for Desktop clients):");
  console.log("  " + REDIRECT);
  console.log("\nOpening the consent screen… if it doesn't open, paste this into your browser:\n");
  console.log("  " + authUrl + "\n");
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} "${authUrl}"`, () => {});
});
