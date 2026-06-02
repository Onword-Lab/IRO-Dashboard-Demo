# IRO — Feature Expansion PRD (v0.3)
### Calendar · Gmail · 명함(Contacts) · 세금(Tax) · 입출금(Banking) · 코딩(Code)

> This document is written so **a non-coder can follow it**. Every section has:
> **What it is → MVP scope → How it works → Data model → Build steps → 🙋 Your work (human) → ✅ Done-when → Effort/Risk.**
> The companion vision doc is `../IRO-PRD.md` (Part 1 MVP, Part 2 the “Ideal IRO”).
> Source of these features: the feature list image (calendar 연동, 지메일 연동, 명함관리, 세금 홈택스, 입출금 관리, 코딩 관리, 삭제 시 허락).

---

## 0. How everything fits (read this first)

IRO is a **Next.js web app**. Each new section is one **page** in the left sidebar, e.g. `/calendar`, `/mail`. Every page follows the **exact same pattern we already use** for Notion & Google Drive:

```
 a "lib/<thing>.ts" adapter   →  talks to the real API (Google, GitHub, …)
 an "app/api/<thing>" route   →  the browser calls this; it runs the adapter on the server
 a "components/<Thing>View"    →  the visible UI (cards, tables, lists)
 a "lib/seed.ts" sample block  →  fake-but-realistic data shown when the real API isn't connected yet
```

**The golden rule (sample → live):** every page **renders immediately with sample data**, even before you connect anything. The moment you finish a section's 🙋 *Your work* (e.g. authorize Google), the same page flips to **live** data automatically. A small badge in the corner says **`sample`** or **`live`** so you always know which you're looking at. This means **you can SEE the whole dashboard today**, and turn on real data one section at a time.

**The shared Google key.** Calendar, Gmail, and Contacts are all Google products. They reuse the **same OAuth login** we already built for Google Drive — we just **add permissions (“scopes”)** to it. You re-run one helper script and click “Allow” once; all three light up.

**Security rules (do not break):**
- Secrets (tokens, client secrets, API keys) live **only** in `iro/.env.local` (never committed, never pasted into chat).
- 🔒 **삭제 가드 (Delete guard):** per your “삭제 시 허락받아야” note — **every delete in IRO pops a confirmation** (“Type the name / press Confirm”). Nothing is ever hard-deleted silently. Built once as `components/ConfirmDelete.tsx` and reused everywhere.

**The phased plan:**

| Phase | What turns on | Your setup effort |
|---|---|---|
| **Now (this build)** | All 6 pages visible with sample data + working UI | none |
| **Phase 1** | Calendar + Mail + Contacts go **live** | 1 Google re-consent + 1–2 Gmail logins |
| **Phase 2** | Code (GitHub) goes live; Tax business-number lookup | 1 GitHub token; (free gov API key) |
| **Phase 3** | Banking auto-fetch + receipt/card OCR | bank-aggregator acct + Google Vision billing |
| **Phase 4** | Tax e-invoice (세금계산서) full sync | Popbill/Barobill paid account + cert |

---

## 1. 📅 Calendar 연동 (Google Calendar)

**What it is.** A page that shows your team’s Google Calendar — upcoming events as an agenda list and a simple month view — inside IRO, so the dashboard is the one place you check the day.

**MVP scope (now).**
- Read-only agenda: today + next 14 days, grouped by day.
- Simple month grid with event dots.
- Filter by which calendar (your calendar / shared team calendar).
- *(Later)* create/edit events from IRO.

**How it works.** Google Calendar has a REST API (`GET /calendar/v3/calendars/{id}/events`). We add the **`calendar.readonly`** permission to our existing Google login. The server adapter `lib/calendar.ts` asks Google for events; the page draws them.

**Data model** (`CalEvent` in `lib/types.ts`):
```
id, title, start (ISO), end (ISO), allDay (bool),
location?, attendees?: string[], calendar (name), htmlLink (open in Google)
```

**Build steps.**
1. Add `CalEvent` type + sample events in `lib/seed.ts`.
2. `lib/calendar.ts`: `calendarConfigured()`, `listUpcoming(days)`, `listCalendars()` using the shared Google token.
3. `app/api/calendar/route.ts`: returns `{ configured, events }`.
4. `components/CalendarView.tsx`: agenda + month grid (client island, same style as `DriveBrowse`).
5. `app/calendar/page.tsx`: renders `<CalendarView/>`.
6. Add **Calendar** to the sidebar “Comms” group.

**🙋 Your work (human).**
- **Add the Calendar permission to the Google login.** In Google Cloud Console → *APIs & Services* → **enable “Google Calendar API”** for the same project you used for Drive.
- Re-run the one-time helper (now asks for Calendar too): in the terminal, inside `iro/`, run `node scripts/get-google-token.mjs`, then click **Allow** on the Google screen. That’s it — the badge flips to `live`.
- *(If you want a shared team calendar)* create one in Google Calendar and share it with the team; it’ll appear in the calendar filter.

**✅ Done-when.** `/calendar` shows your real next-2-weeks events; the badge says `live`; clicking an event opens it in Google Calendar.

**Effort/Risk.** *Low.* Reuses existing Google auth; read-only is safe.

---

## 2. ✉️ 지메일 연동 (Gmail — sihoon.kim@ & jinho.kim@onwordlab.com)

**What it is.** A unified inbox inside IRO showing recent email threads from the two work accounts, so you triage without leaving the dashboard.

**MVP scope (now).**
- Unified list of recent threads (subject, sender, snippet, date, unread dot), labeled by which account.
- Filter: All / Sihoon / Jinho / Unread.
- Open a thread → read messages (read-only).
- *(Later)* reply / send — **send always requires your explicit confirm** (no silent sending).

**How it works.** Gmail has a REST API (`users.messages.list` + `get`). Each of the two accounts authorizes once (permission **`gmail.readonly`**), producing **two refresh tokens** stored in `.env.local` (`GMAIL_REFRESH_TOKEN_SIHOON`, `GMAIL_REFRESH_TOKEN_JINHO`). The adapter fetches both and merges by date.

> Why two logins? Gmail data is per-mailbox. The cleanest path for a 2-person team is: each person clicks “Allow” once. (A fancier “Workspace domain-wide delegation” exists but needs Google Workspace admin setup — overkill for now.)

**Data model** (`MailThread`):
```
id, account ("sihoon"|"jinho"), from (name+email), subject,
snippet, date (ISO), unread (bool), labels?: string[], permalink
```

**Build steps.**
1. Add `MailThread` type + sample threads in seed.
2. `lib/gmail.ts`: `gmailConfigured()`, `listThreads({account, query, max})` for one account; `listAllThreads()` merges both. Uses a small token helper that accepts a per-account refresh token.
3. `app/api/mail/route.ts`: `{ configured, threads }`.
4. `components/MailView.tsx`: filter chips + thread list + thread reader panel.
5. `app/mail/page.tsx`.
6. Sidebar “Comms” → **Mail**.

**🙋 Your work (human).**
- In Google Cloud Console → **enable “Gmail API.”**
- Run the helper twice, once per account: `node scripts/get-google-token.mjs --account=sihoon` then `--account=jinho`. Each opens a Google screen — **log in as that account and click Allow.** Tokens save themselves to `.env.local`.
- Decide now: **read-only** (recommended for v1) vs. also allow **send**. We start read-only.

**✅ Done-when.** `/mail` lists real recent threads from both inboxes, filterable by account; opening a thread shows the messages.

**Effort/Risk.** *Medium.* Two logins; OAuth consent screen may show an “unverified app” warning until you publish it (you can click “Advanced → continue” for your own accounts).

---

## 3. 🪪 명함관리 (Business cards → Google Contacts)

**What it is.** Manage business cards: see your Google Contacts in IRO, and **snap a photo of a paper business card → it auto-reads the text → fills a new contact → you confirm → it saves to Google Contacts.**

**MVP scope (now).**
- Contacts list (name, company, title, phone, email) read from Google Contacts.
- “Add contact” manual form → saves to Google Contacts.
- **Card scan:** upload a photo → OCR extracts text → auto-fills the form → you review → save.
- Search/filter contacts.

**How it works.** Two Google pieces:
- **Google People API** (permission `contacts`) — list and create contacts.
- **OCR for the card photo** — **Google Cloud Vision API** (`DOCUMENT_TEXT_DETECTION`) reads the text off the image; then we parse it into fields (name/company/phone/email). Parsing uses simple rules first, and can later use a Claude call for messy cards.

**Data model** (`Contact`):
```
id, name, company?, title?, phones?: string[], emails?: string[],
note?, source ("manual"|"card"|"google"), photoUrl?
```

**Build steps.**
1. `Contact` type + sample contacts in seed.
2. `lib/contacts.ts`: `contactsConfigured()`, `listContacts()`, `createContact(input)` via People API.
3. `lib/ocr.ts`: `ocrConfigured()`, `readCard(imageBase64)` → raw text → `parseCard(text)` → `{name, company, phones, emails}`.
4. Routes: `app/api/contacts/route.ts` (GET list / POST create), `app/api/contacts/scan/route.ts` (POST image → parsed fields).
5. `components/ContactsView.tsx`: list + “Add” modal + “Scan card” uploader (shows OCR result for confirmation before saving). Delete uses the **ConfirmDelete** guard.
6. `app/contacts/page.tsx`. Sidebar “Comms” → **Contacts**.

**🙋 Your work (human).**
- Google Cloud Console → **enable “People API”** and **“Cloud Vision API.”**
- **Vision needs billing enabled** on the Google Cloud project (Vision has a free monthly tier — first 1,000 images/month free — but Google requires a billing account on file). Add a billing account in the console. *(This is the only paid-ish step in Phase 3 and is effectively free at our volume.)*
- Re-run the Google helper so the login also includes the `contacts` permission, click Allow.

**✅ Done-when.** `/contacts` lists your Google Contacts; manual add creates a real contact; uploading a card photo pre-fills the form from the photo’s text.

**Effort/Risk.** *Medium.* People API is easy; the **card-photo OCR + parsing** is the trickier bit (real cards vary). MVP shows the OCR result for you to correct before saving, so accuracy isn’t critical to be useful.

---

## 4. 🧾 세금 (홈택스 연동 / 세금계산서)

**What it is.** Tax helper: track electronic tax invoices (전자세금계산서) and validate client business numbers — pulling from Korea’s tax system.

**The honest reality (important).** 홈택스(NTS) has **no friendly public API you can just call** for issuing/reading 세금계산서. There are **three real paths**, easiest→hardest:

1. **사업자등록 상태조회 (business-number status lookup)** — **FREE** government open API on `data.go.kr` (국세청 사업자등록정보 진위확인 및 상태조회). Validate a client’s 사업자번호 (active/closed, tax type). **We can wire this now.**
2. **전자세금계산서 (e-tax invoices)** — done through a **licensed relay service**: **Popbill (팝빌)**, **Barobill (바로빌)**, or **더존**. These have clean REST APIs that issue invoices and sync with 홈택스. They need a **business account + paid plan** (very cheap per-invoice) and sometimes a **공동인증서 (certificate)**.
3. **Direct 홈택스 scraping/cert login** — fragile, not recommended.

**MVP scope.**
- **Now (sample):** Tax invoices page — list of invoices (date, partner, supply amount 공급가액, VAT 세액, total, status 발행/전송/미발행), monthly summary cards (this month’s sales VAT vs purchase VAT).
- **Phase 2 (free, real):** business-number lookup box — paste a 사업자번호 → shows active/closed + tax type, via the free gov API.
- **Phase 4 (paid, real):** connect Popbill → invoices become live; issue invoices from IRO.

**Data model** (`TaxInvoice`):
```
id, type ("sales"|"purchase"), issueDate, partnerName, partnerBizNo,
supplyAmount, vat, total, status ("issued"|"sent"|"draft"), ntsConfirmNum?
```

**Build steps.**
1. `TaxInvoice` type + sample invoices in seed (a few sales + purchase rows).
2. `lib/tax.ts`: `taxConfigured()` (true when a relay key exists), `listInvoices()` (sample now; Popbill later), and `lookupBizNo(num)` (free gov API — Phase 2).
3. `app/api/tax/route.ts` (invoices) + `app/api/tax/bizno/route.ts` (lookup).
4. `components/TaxView.tsx`: summary cards + invoice table + a “check a business number” box. **Issue/void actions are stubs** with a “connect Popbill to enable” note.
5. `app/tax/page.tsx`. Sidebar “Finance” → **Tax**.

**🙋 Your work (human).**
- *(Phase 2, free)* Get a `data.go.kr` API key for **국세청 사업자등록 상태조회** (free signup, instant key) → paste into `.env.local` as `DATA_GO_KR_KEY`.
- *(Phase 4, paid)* Decide a relay: **Popbill** (팝빌) is the most popular for indie/SMB. Sign up with the business registration, get API keys, (issue/install the certificate if required). Then I wire `lib/tax.ts` to Popbill’s SDK.

**✅ Done-when.** Now: `/tax` shows the invoice table + summary on sample data. Phase 2: the business-number box returns real active/closed status. Phase 4: invoices are live from Popbill.

**Effort/Risk.** *Now: Low. Phase 2: Low. Phase 4: Medium–High* (third-party account, cert, billing). We clearly separate them so you’re never blocked.

---

## 5. 💸 입출금 관리 (Cash in/out · receipts)

**What it is.** Track money in and out: bank deposits/withdrawals + expenses, with **receipt photo → auto-entry**.

**The honest reality.**
- **Bank transaction auto-fetch** options: **오픈뱅킹 (금융결제원)** is the official route but needs **institutional registration** (heavy for a 3-person startup at first). **CODEF (코드에프 by 쿠콘)** is a popular **aggregator API** that fetches bank transaction history using the account’s credentials/cert — much easier to start with. Or **manual / CSV import** from your bank’s download.
- **“앱 푸쉬 알림으로 입출금 fetch”** (your note) means a **phone app that reads the bank’s push/SMS** the instant money moves. That’s an **Android companion app** (NotificationListener) — a separate small project from this web app. We note it as Phase 3+.
- **Receipt OCR** = the same **Google Vision** as business cards: snap receipt → read amount/date/vendor → expense row.

**MVP scope.**
- **Now:** Transactions ledger (date, type 입금/출금, counterparty, amount, balance, category, memo) — **manual add/edit/delete** (dashboard-owned, like Projects), sample rows to start. Summary cards: this month in / out / net.
- **Now:** **CSV import** of a bank statement (you download from your bank, drop the file, rows appear).
- **Phase 3:** **Receipt photo → OCR → expense row** (Vision).
- **Phase 3+:** **CODEF auto-fetch**; the push-notification companion app.

**Data model** (`Tx`):
```
id, date, direction ("in"|"out"), counterparty, amount, balance?,
category?, memo?, source ("manual"|"csv"|"receipt"|"bank"), receiptUrl?
```

**Build steps.**
1. `Tx` type + sample transactions in seed.
2. `lib/finance-store.ts`: dashboard-owned CRUD (same file-store pattern as `projects-store.ts`) → `.data/transactions.json` now, Supabase later.
3. `lib/csv.ts`: parse a pasted/uploaded bank CSV into `Tx[]` (map common Korean bank columns: 거래일시/적요/출금/입금/잔액).
4. Routes: `app/api/finance/route.ts` (list/create), `app/api/finance/[id]/route.ts` (edit/delete), `app/api/finance/import/route.ts` (CSV).
5. `components/FinanceView.tsx`: summary cards + ledger table + add/edit modal + CSV dropzone. Delete → **ConfirmDelete** guard.
6. `app/finance/page.tsx`. Sidebar “Finance” → **Banking**.

**🙋 Your work (human).**
- *(Now)* nothing — manual + CSV works immediately.
- *(Phase 3)* enable **Google Vision** (same as Contacts) for receipts.
- *(Phase 3+)* sign up for **CODEF** (or register for 오픈뱅킹) if you want fully automatic bank sync; decide whether to build the **Android push companion** app.

**✅ Done-when.** Now: you can add/edit/delete transactions and import a bank CSV; summary cards total correctly. Phase 3: a receipt photo creates an expense row.

**Effort/Risk.** *Now: Low. Receipt OCR: Medium. Bank auto-fetch: Medium–High* (aggregator account/cert).

---

## 6. 💻 코딩 관리 (GitHub + Claude Code context)

**What it is.** A dev panel: see your GitHub activity (repos, recent commits, open PRs/issues) in IRO, link a repo to a project, and — the bigger vision — connect each project’s repo to **Claude Code with the unified Onword context** (“통합 컨텍스트와 클코 연결”).

**MVP scope.**
- **Now:** GitHub overview — org/user repos with last-updated, recent commits, open PRs, open issues. Sample data first.
- **Attach a repo to a project** (just like Notion/Drive attach) so a project links to its codebase.
- *(Vision / later)* per-project Claude Code sessions that read the Onword DB context; auto-commit loop. Documented in `../IRO-PRD.md` Part 2.

**How it works.** GitHub REST API with a **Personal Access Token (fine-grained)** or a GitHub App. Adapter `lib/github.ts` lists repos/commits/PRs.

**Data model** (`Repo`, `Commit`, `PullRequest`):
```
Repo:    id, name, fullName, description?, updatedAt, openIssues, url, private(bool)
Commit:  sha, message, author, date, repo, url
PullRequest: id, title, repo, author, state, updatedAt, url
```

**Build steps.**
1. Types + sample repos/commits/PRs in seed.
2. `lib/github.ts`: `githubConfigured()`, `listRepos()`, `recentCommits()`, `openPRs()`.
3. `app/api/code/route.ts`: `{ configured, repos, commits, prs }`.
4. `components/CodeView.tsx`: repo cards + commit feed + PR list.
5. `app/code/page.tsx`. Sidebar “Dev” → **Code**.
6. *(Optional now)* add a `github` ref to `Project` for repo attach (mirrors `notion`/`drive`).

**🙋 Your work (human).**
- Create a **GitHub fine-grained Personal Access Token** (GitHub → Settings → Developer settings → Fine-grained tokens): grant **read-only** on the repos/org you want IRO to show. Paste into `.env.local` as `GITHUB_TOKEN`, and set `GITHUB_ORG` (or your username).

**✅ Done-when.** `/code` lists your real repos, recent commits, and open PRs; you can attach a repo to a project.

**Effort/Risk.** *Low* for the read-only GitHub view. The Claude-Code-loop vision is a separate, larger track (Part 2).

---

## 7. 🔒 삭제 가드 — “삭제 시 허락받아야” (global delete guard)

**Requirement (yours).** Nothing gets deleted without explicit permission.

**How we implement it.**
- One reusable component `components/ConfirmDelete.tsx`: a modal that names the item and requires a deliberate **Confirm** (for high-value items, you must **type the item’s name** to enable the button).
- **Every** delete button in IRO (projects, transactions, contacts, …) routes through it. No API delete runs without it on the client.
- *(Later, multi-user)* deletes can require a **second person’s approval** and write to an **audit log** (`.data/audit.json` → Supabase). Documented as Phase 2 of multi-user.

**✅ Done-when.** Trying to delete anything shows the confirmation; cancel = nothing happens; confirm = it deletes and (later) logs who/when.

---

## 8. New navigation (left sidebar) after this build

```
OPERATIONS   Projects · Tasks
COMMS        Calendar · Mail · Contacts
FINANCE      Banking · Tax
DEV          Code
SOURCES      Notion · Google Drive
```

Each page shows a `sample`/`live` badge so the team always knows the data state.

---

## 9. Consolidated 🙋 “Your work” checklist (all human steps, in order)

> Do these when you want a section to go from **sample → live**. None of them block the others.

**Google (covers Calendar, Mail, Contacts) — Phase 1**
1. Google Cloud Console → same project as Drive → **Enable APIs:** Google Calendar API, Gmail API, People API. *(Cloud Vision API too if you want receipt/card OCR.)*
2. Terminal in `iro/` → `node scripts/get-google-token.mjs` → click **Allow** (this re-consents with the new permissions for your main account → Calendar + Contacts live).
3. For Mail’s second inbox: `node scripts/get-google-token.mjs --account=jinho` → log in as Jinho → **Allow**.
4. *(OCR)* In Cloud Console, attach a **billing account** to the project (Vision’s first 1,000 images/month are free).

**GitHub (Code) — Phase 2**
5. Create a **fine-grained read-only PAT**, set `GITHUB_TOKEN` + `GITHUB_ORG` in `.env.local`.

**Tax — Phase 2 (free) / Phase 4 (paid)**
6. *(free)* Get a `data.go.kr` key for 국세청 사업자등록 상태조회 → `DATA_GO_KR_KEY`.
7. *(paid, when ready)* Open a **Popbill/Barobill** business account for 세금계산서; hand me the API keys to wire.

**Banking — Phase 3+**
8. *(optional)* Open a **CODEF** account (or register 오픈뱅킹) for automatic bank sync.
9. *(optional)* Decide whether to build the **Android push-notification companion** app for instant deposit alerts.

> Reminder: **paste all keys only into `iro/.env.local`** — never into chat. The Google helper writes its token there for you automatically.

---

## 10. Build order & status (what I’m building now vs. later)

| # | Section | Page | Live adapter | Now = | Live needs |
|---|---|---|---|---|---|
| 1 | Calendar | `/calendar` | `lib/calendar.ts` | sample agenda+month | step 1–2 |
| 2 | Mail | `/mail` | `lib/gmail.ts` | sample inbox | step 1–3 |
| 3 | Contacts | `/contacts` | `lib/contacts.ts`+`ocr.ts` | sample list + scan UI | step 1–2,(4) |
| 4 | Tax | `/tax` | `lib/tax.ts` | sample invoices + summary | step 6 / 7 |
| 5 | Banking | `/finance` | `lib/finance-store.ts` | **working** manual + CSV | (3) for OCR |
| 6 | Code | `/code` | `lib/github.ts` | sample repos/commits/PRs | step 5 |
| — | Delete guard | everywhere | `ConfirmDelete.tsx` | **working** | — |

“**working**” = fully functional today (no external account needed). “sample” = full UI on placeholder data, flips to live after your step.

---
*End of Feature Expansion PRD v0.3. Next doc to update as we go: this table’s “status” column + each section’s ✅ Done-when.*
