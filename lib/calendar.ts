// LIVE Google Calendar adapter. Reuses the shared Google token (lib/google.ts),
// so connecting is just: enable Calendar API + re-run scripts/get-google-token.mjs.
import type { CalEvent } from "./types";
import { googleAccessToken, googleConfigured } from "./google";

export function calendarConfigured(): boolean {
  return googleConfigured("GOOGLE_REFRESH_TOKEN");
}

// Upcoming events on the primary calendar for the next `days` days.
export async function listUpcoming(days = 14): Promise<CalEvent[]> {
  const token = await googleAccessToken();
  if (!token) throw new Error("Calendar not configured");

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 86_400_000).toISOString();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status} ${await res.text()}`);
  const json = await res.json();

  return (json.items ?? []).map((e: any): CalEvent => {
    const allDay = !!e.start?.date && !e.start?.dateTime;
    return {
      id: e.id,
      title: e.summary || "(no title)",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay,
      location: e.location,
      attendees: (e.attendees ?? []).map((a: any) => a.displayName || a.email).filter(Boolean),
      calendar: json.summary || "primary",
      htmlLink: e.htmlLink,
    };
  });
}
