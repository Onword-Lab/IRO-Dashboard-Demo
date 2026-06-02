#!/usr/bin/env node
// One-time Google OAuth helper → mints a refresh token for IRO.
//
//   node scripts/get-google-token.mjs                 # main account (Drive+Calendar+Contacts+Gmail)
//   node scripts/get-google-token.mjs --account=jinho # a second inbox → GMAIL_REFRESH_TOKEN_JINHO
//
// Prereq: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in iro/.env.local
// (from a Google Cloud "Desktop app" OAuth client). In Google Cloud Console,
// ENABLE these APIs for the project: Drive, Google Calendar, Gmail, People.
// Desktop clients allow loopback redirects, so no redirect URI registration is
// needed. The minted refresh token is written straight into .env.local.
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

// --account=NAME → mint a Gmail-only token saved as GMAIL_REFRESH_TOKEN_<NAME>.
const accArg = process.argv.find((a) => a.startsWith("--account="));
const ACCOUNT = accArg ? accArg.split("=")[1].trim().toLowerCase() : null;
const TARGET_VAR = ACCOUNT ? `GMAIL_REFRESH_TOKEN_${ACCOUNT.toUpperCase()}` : "GOOGLE_REFRESH_TOKEN";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = Number(process.env.GOOGLE_OAUTH_PORT || 53682);
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;

// Main account gets the full read set; a named inbox only needs Gmail read.
const SCOPES = ACCOUNT
  ? ["https://www.googleapis.com/auth/gmail.readonly"]
  : [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/contacts",
    ];
const SCOPE = SCOPES.join(" ");

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
    const re = new RegExp(`^${TARGET_VAR}=.*$`, "m");
    env = re.test(env)
      ? env.replace(re, `${TARGET_VAR}=${tok.refresh_token}`)
      : (env === "" || env.endsWith("\n") ? env : env + "\n") + `${TARGET_VAR}=${tok.refresh_token}\n`;
    writeFileSync(envPath, env);
    res.end(`✓ Success! ${TARGET_VAR} saved to .env.local — return to your terminal. You can close this tab.`);
    const t = tok.refresh_token;
    console.log(`\n✓ Saved ${TARGET_VAR} (${t.slice(0, 6)}…${t.slice(-4)}) to iro/.env.local`);
    console.log("Next:  npm run dev   → the relevant page badge should flip to  live\n");
    server.close(); process.exit(0);
  } catch (e) {
    res.end("Token exchange failed — see terminal.");
    console.error("✗ Token exchange failed:", e);
    server.close(); process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\nIRO · Google OAuth helper${ACCOUNT ? ` (account: ${ACCOUNT})` : ""}`);
  console.log("Scopes:", SCOPE);
  console.log("Redirect URI (loopback, auto-allowed for Desktop clients):");
  console.log("  " + REDIRECT);
  console.log("\nOpening the consent screen… if it doesn't open, paste this into your browser:\n");
  console.log("  " + authUrl + "\n");
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} "${authUrl}"`, () => {});
});
