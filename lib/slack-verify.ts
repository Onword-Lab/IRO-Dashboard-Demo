// Verify that an incoming Events API request really came from Slack.
// Slack signs each request: v0 = HMAC-SHA256( "v0:{timestamp}:{rawBody}", signingSecret ).
// We compare to the X-Slack-Signature header and reject requests older than 5 min
// (replay protection). SLACK_SIGNING_SECRET comes from your Slack app's Basic Info.
import crypto from "crypto";

export function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false; // 5-min window

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
