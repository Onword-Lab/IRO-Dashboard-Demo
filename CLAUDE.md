# CLAUDE.md — IRO (coding-agent context)

You are the **coding agent** for **IRO**, Onword's internal AI-native ops dashboard
(dogfooding instance + future product). Orchestration is done by a **Hermes** agent in
Slack; you receive scoped specs and implement them. Read this before editing.

## What IRO is
A small internal web dashboard for Onword's 3-person team. Two modules now:
**Project Management** and **Task Management**, wired to the team's real **Notion** and
**Google Drive**. It also doubles as a live sales demo. Full product spec + the bigger
vision live in `../IRO-PRD.md` (Part 1 = MVP, Part 2 = the "Ideal IRO").

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · lucide-react. Server components fetch
data; small `"use client"` islands handle interactivity. Deployed target: Vercel.

## Architecture rules (do not break)
- **All data goes through the facade `lib/data.ts`.** UI/components never call Notion or
  Drive directly. `data.ts` returns LIVE data when credentials exist, else the real-data
  snapshot in `lib/seed.ts`. Keep this seam intact and keep the snapshot fallback working.
- Live adapters: `lib/notion.ts` (Projects + IRO Tasks via Notion REST), `lib/drive.ts`
  (folder trees via Drive REST; auto-exchanges `GOOGLE_REFRESH_TOKEN`→access token).
- Live fetches use `cache: "no-store"`; pages are `dynamic = "force-dynamic"`.
- Freshness = "Level A": `components/AutoRefresh.tsx` polls every ~45s + a manual ↻ button.

## Key files
```
app/layout.tsx                 shell (Sidebar + TopBar + content)
app/projects/page.tsx          projects list
app/projects/[id]/page.tsx     project detail → ProjectDetail (Notion ⇄ Drive toggle)
app/tasks/page.tsx             tasks → TaskBoard (board/list)
components/{Sidebar,TopBar,ProjectCard,ProjectDetail,TaskBoard,AutoRefresh,ui}.tsx
lib/{types,data,notion,drive,seed}.ts
scripts/get-google-token.mjs   one-time Google OAuth → prints GOOGLE_REFRESH_TOKEN
```

## Data sources (real)
- Notion **Projects** DB → `collection://2f1559df-de85-8098-ba5d-000b5743f31e`
  (Project name·Assignee·Status·Priority·Start/End·Team·Attach file).
- Notion **IRO Tasks** DB → page `63bad0475a4e40399cf8526a2c979658`,
  data source `collection://84f68620-c6a5-491c-986d-36e456439e74`
  (Task·Status[Todo/Doing/Review/Done]·Priority·Assignee·Due date·Project relation·Tags·Notes·Source).
- Google Drive = the "Company Database". Project↔folder map in `LINKING.md` (manual pick).

## Design language
Anthropic palette (tokens in `tailwind.config.ts`): cream `#F5F1E8` bg · surface `#FAF7F0`
· coral `#D97757` accent · charcoal `#1F1F1E` text · sage `#7C9A6A` · amber `#C89B3C` ·
line `#E8E2D5`. Inter/Pretendard; JetBrains Mono for data rows. Calm "glance" density.

## Run & verify (must pass before any commit)
```bash
npm install
npm run build          # must compile with no type errors
npm run dev            # smoke-test /projects, /tasks, /projects/[id] → 200
```
Default run uses the snapshot (no creds needed). Live mode: copy `.env.example`→`.env.local`,
add `NOTION_TOKEN` + Google creds (see README). **Never commit `.env.local` or any secret.**

## Scope guardrails
- In scope now: Projects, Tasks, the Notion/Drive toggle, live + auto-refresh.
- Deferred (don't build unless told): agent panel, Home, Clients, Calendar, the Onword-DB
  raw→MD pipeline + 6 agents, Claude Code↔DB loop, per-project GitHub auto-commit, e-commerce.
- Conventional commits. Small, verifiable changes. Ask before destructive/irreversible ops.

## Open work (typical next specs)
1. Persist manual project↔Drive-folder links (currently an in-memory `<select>`).
2. Create per-project Drive folders for projects 3–8; link them.
3. Tasks write-back to Notion (create / edit / move status).
4. Lazy subfolder expansion in the Drive tree.
5. Deploy to Vercel with env vars.
