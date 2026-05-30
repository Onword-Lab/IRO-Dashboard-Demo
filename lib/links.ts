// Manual Project → Drive-folder links (the "manual pick" step), keyed by project slug.
// Persisted here so the link survives even when projects load LIVE from Notion
// (Notion has no Drive-folder field). Slugs match Project Hub row names.
export const driveLinks: Record<string, string> = {
  "iro": "1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT", // IRO → "Knowledge store real" (demo: shows real PDFs)
  "호핑-hoping": "1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH", // 호핑 Hoping → "호핑 Hoping" Drive folder (semantic match)
};
