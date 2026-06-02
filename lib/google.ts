// Shared Google OAuth access-token exchange.
// ALL Google adapters (Drive, Calendar, Gmail, Contacts) reuse this so there is
// one auth path. We trade a long-lived refresh token for a short-lived access
// token and cache it in memory (keyed per refresh token) until it nears expiry.
//
// Get / refresh tokens once with:  node scripts/get-google-token.mjs
//   • main account  → GOOGLE_REFRESH_TOKEN        (Drive + Calendar + Contacts)
//   • per inbox     → GMAIL_REFRESH_TOKEN_<NAME>  (e.g. _SIHOON, _JINHO)

const cache: Record<string, { token: string; exp: number }> = {};

/** True when the OAuth client + a refresh token for `refreshEnv` are present. */
export function googleConfigured(refreshEnv = "GOOGLE_REFRESH_TOKEN"): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env[refreshEnv]
  );
}

/** Exchange a refresh token (defaults to GOOGLE_REFRESH_TOKEN) for an access token. */
export async function googleAccessToken(refreshToken?: string): Promise<string | null> {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  const key = refresh.slice(-12);
  const now = Date.now();
  if (cache[key] && now < cache[key].exp - 60_000) return cache[key].token;

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
  cache[key] = { token: tok.access_token, exp: now + (tok.expires_in ?? 3600) * 1000 };
  return cache[key].token;
}
