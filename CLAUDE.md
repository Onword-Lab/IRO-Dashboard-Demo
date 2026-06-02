# CLAUDE.md — IRO (coding-agent context)

You are the **coding agent** for **IRO**, Onword's internal AI-native ops dashboard
(dogfooding instance + future product). Orchestration is done by a **Hermes** agent in
Slack; you receive scoped specs and implement them. Read this before editing.

## What IRO is
A small internal web dashboard for Onword's 3-person team. Modules: **Projects** &
**Tasks** (Operations); **Calendar · Mail · Contacts** (Comms); **Banking · Tax**
(Finance); **Code** (Dev); plus **Notion** & **Google Drive** browser sections
(Sources). It also doubles as a live sales demo. Full product spec + the bigger
vision live in `../IRO-PRD.md` (Part 1 = MVP, Part 2 = the "Ideal IRO"); the v0.3
feature build is specced in `docs/FEATURES-PRD.md` (non-coder, step-by-step).

**v0.3 "sample → live" pattern:** every feature page renders on sample data
(`lib/seed.ts`) and flips to live automatically when its adapter is configured. The
API route returns `{ configured, ... }`; the page shows `<SourceBadge live={...}/>`.
Google features (Calendar/Mail/Contacts) share ONE OAuth via `lib/google.ts`
(`googleAccessToken`/`googleConfigured`). **Delete guard:** every delete routes
through `components/ConfirmDelete.tsx` (rule: "삭제 시 허락받아야").

**Key model (v0.2):** projects are **owned by the dashboard's own backend** — teammates
add / edit / delete them in-app (CRM-style table à la 윤비서). Notion & Google Drive are
**optional per-project attachments** the user picks, NOT the source of the project list.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · lucide-react. Server components fetch
data; small `"use client"` islands handle interactivity. Deployed target: Vercel.

## Architecture rules (do not break)
- **Projects live in our OWN store** — `lib/projects-store.ts`. Backend swap is a single
  file: NOW a JSON file at `.data/projects.json` (gitignored, dev/preview); LATER Supabase
  Postgres on deploy. CRUD only flows through `app/api/projects/*` route handlers.
- **All reads go through the facade `lib/data.ts`.** UI/components never call Notion/Drive
  adapters directly. `getProjects` → store; `getTasks` → live Notion (snapshot fallback in
  `lib/seed.ts`); attached Notion/Drive content → live adapters.
- Live adapters: `lib/notion.ts` (IRO Tasks + `searchNotion` + `renderNotionRef`),
  `lib/drive.ts` (folder trees + `listFolders`; auto-exchanges `GOOGLE_REFRESH_TOKEN`).
- Live fetches use `cache: "no-store"`; pages are `dynamic = "force-dynamic"`; API routes
  are `runtime = "nodejs"` (the file store needs fs).
- Freshness = "Level A": `components/AutoRefresh.tsx` polls every ~45s + a manual ↻ button.

## Key files
```
app/layout.tsx                 shell (Sidebar + TopBar + content)
app/projects/page.tsx          → ProjectsView (CRM table: KPIs, filters, search, add, masking)
app/projects/[id]/page.tsx     → ProjectDetail (Notion ⇄ Drive toggle + attach pickers + edit/delete)
app/tasks/page.tsx             tasks → TaskBoard (board/list)
app/notion/page.tsx            → NotionBrowse (search workspace)
app/drive/page.tsx             → DriveBrowse (browse folders)
app/{calendar,mail,contacts,finance,tax,code}/page.tsx   v0.3 feature pages (thin → *View)
app/api/projects/{route,[id]/route}.ts   project CRUD
app/api/notion/search/route.ts           Notion attach picker / browse
app/api/drive/folders/route.ts           Drive attach picker / browse
app/api/calendar/route.ts                live-or-sample {configured, events}
app/api/mail/route.ts                    live-or-sample {configured, threads}
app/api/contacts/{route,[id]/route,scan/route}.ts   contacts CRUD + card OCR scan
app/api/finance/{route,[id]/route,import/route}.ts  ledger CRUD + CSV import
app/api/tax/{route,bizno/route}.ts       invoices(sample) + 사업자번호 lookup
app/api/code/route.ts                    live-or-sample {configured, repos, commits, prs}
components/{Sidebar,TopBar,ProjectsView,ProjectForm,ProjectDetail,NotionBrowse,DriveBrowse,TaskBoard,AutoRefresh,ui}.tsx
components/{CalendarView,MailView,ContactsView,FinanceView,TaxView,CodeView,ConfirmDelete}.tsx   v0.3
lib/{types,data,projects-store,notion,drive,seed}.ts
lib/google.ts                  shared Google token (Drive+Calendar+Gmail+Contacts)
lib/{calendar,gmail,contacts,ocr,github,tax}.ts          v0.3 live adapters
lib/{finance-store,contacts-store}.ts    dashboard-owned file stores (.data/*.json)
lib/csv.ts                     bank-statement CSV → Tx[]
scripts/get-google-token.mjs   Google OAuth → GOOGLE_REFRESH_TOKEN (+ --account=<x> → GMAIL_REFRESH_TOKEN_<X>)
```

## Data sources (real)
- **Projects = dashboard-owned** (our store). Fields: code·name·client·type(Agency/Education/
  Content/Internal/Other)·status(Planned/In progress/Done/On hold/Cancelled)·owner·revenue·
  start/end·description·`notion` ref·`drive` ref. Start empty; teammates add their own.
- Notion **IRO Tasks** DB → `NOTION_TASKS_DB=63bad047-5a4e-4039-9cf8-526a2c979658`
  (Task·Status[Todo/Doing/Review/Done]·Priority·Assignee·Due date·Project relation·Tags·Notes·Source).
- A Notion page/database can be **attached per project** (`searchNotion` picker).
- Google Drive = the "Company Database"; a folder can be **attached per project** (`listFolders` picker).

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
1. **Swap the file store → Supabase** for deploy (impl `lib/projects-store.ts` against
   Postgres; keep the same exported CRUD signature). Add Supabase env to Vercel.
2. Deploy to Vercel (env vars: NOTION_TOKEN, GOOGLE_* , NOTION_TASKS_DB, Supabase).
3. Tasks: also dashboard-owned (create/edit/move) instead of read-only from Notion.
4. Link tasks→projects by the new project id (currently best-effort name match).
5. Lazy subfolder expansion in the Drive tree; sortable table columns.
