// Supabase client (server-side). Used when SUPABASE_URL + a key are present;
// otherwise the app falls back to the local .data/*.json file stores.
// This is the production backend for Vercel (file stores don't persist there)
// and the basis for realtime (slack_messages) + per-user Slack tokens.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
}

export function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Next.js App Router caches fetch() by default, which would return STALE
      // Supabase reads. Force no-store so every query hits Postgres fresh.
      global: { fetch: (input: any, init?: any) => fetch(input, { ...(init ?? {}), cache: "no-store" }) },
    });
  }
  return client;
}
