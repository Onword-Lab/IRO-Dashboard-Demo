# IRO — Onword internal ops dashboard (MVP)

Two modules — **Projects** and **Tasks** — wired to Onword's real **Notion** and
**Google Drive**. Open a project to see its reference panel with a **Notion ⇄ Drive
toggle**. Anthropic-style palette, calm "glance" density.

## Run

```bash
cd iro
npm install
npm run dev        # http://localhost:3000  → redirects to /projects
```

By default it runs on a **real-data snapshot** (`lib/seed.ts`) captured 2026-05-30 from
the live connections — 8 real projects, the new "IRO Tasks" DB (5 sample tasks), and real
Drive folders/files. No credentials needed to demo.

## Going live + auto-refresh

Copy `.env.example` → `.env.local` and fill in. With creds present the same UI reads
**live** and **auto-refreshes** (Level A): every page load re-fetches (`cache: "no-store"`),
the top bar polls every ~45s via `router.refresh()`, and the **↻ button** refreshes on demand.
The data facade (`lib/data.ts`) auto-selects live vs snapshot per source; the top bar shows
each source's mode.

**Notion**
1. Create an internal integration at <https://www.notion.so/my-integrations>, copy its secret → `NOTION_TOKEN`.
2. **Share** the *Projects* DB, the *IRO Tasks* DB, and each project page with the integration (••• → Connections). Data-source IDs are pre-filled in `.env.example`.

**Google Drive** (one-time)
1. Google Cloud Console → new project → **enable Drive API**.
2. OAuth consent screen (External; add yourself as a test user).
3. Create credentials → **OAuth client ID → Desktop app** → copy `client_id` + `client_secret` into `.env.local`.
4. Mint a refresh token once:
   ```bash
   node scripts/get-google-token.mjs   # opens consent, prints GOOGLE_REFRESH_TOKEN
   ```
   Paste the printed `GOOGLE_REFRESH_TOKEN` into `.env.local`. Done — `lib/drive.ts`
   auto-exchanges it for access tokens (cached in memory until ~expiry).

> Level B (instant push via Drive `changes.watch` webhooks + SSE/WebSocket) is a later
> add — it pairs with the Onword-Database pipeline in `../IRO-PRD.md` (Part 2).

## Structure

```
app/
  layout.tsx              shell: Sidebar + TopBar + content
  projects/page.tsx       projects list  (reads getProjects)
  projects/[id]/page.tsx  project detail (Notion ⇄ Drive toggle + linked tasks)
  tasks/page.tsx          tasks board/list (reads getTasks)
components/               Sidebar, TopBar, ProjectCard, ProjectDetail, TaskBoard, ui
lib/
  data.ts    facade (live vs snapshot)   types.ts   seed.ts (real snapshot)
  notion.ts  live Notion adapter         drive.ts   live Drive adapter
```

## Scope (this build)
- ✅ Projects (list + detail with Notion/Drive toggle), Tasks (board + list)
- ⬜ Later: agent panel, Home, Clients, Calendar, the Onword-Database compile pipeline,
  Claude Code ↔ DB loop, per-project GitHub auto-commit (see `../IRO-PRD.md`).

See `LINKING.md` for the live Project ↔ Notion ↔ Drive mapping.
