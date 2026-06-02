// Server-Sent Events stream: the dashboard subscribes here and receives inbound
// Slack messages (from the webhook) the instant they arrive — true low-latency.
//
// LOCAL DEV only: pairs with the in-memory bus (lib/slack-bus). On Vercel
// serverless, replace this with a Supabase Realtime subscription on the client.
import { onSlackEvent } from "@/lib/slack-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const enc = new TextEncoder();
  let unsub: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(": connected\n\n"));
      unsub = onSlackEvent((m) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(m)}\n\n`)); } catch { /* closed */ }
      });
      ping = setInterval(() => {
        try { controller.enqueue(enc.encode(": ping\n\n")); } catch { /* closed */ }
      }, 25000);
    },
    cancel() {
      if (ping) clearInterval(ping);
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
