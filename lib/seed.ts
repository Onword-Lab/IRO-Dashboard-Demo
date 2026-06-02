// Real-data snapshot captured 2026-05-30 from the live Notion + Google Drive
// connections (workspace: Sihoon Kim / ksihoon312@gmail.com), PLUS clearly-fake
// "sample" data for the v0.3 feature pages (Calendar/Mail/Contacts/Tax/Banking/
// Code). Sample data renders when the real API isn't connected yet, so the whole
// dashboard is viewable today and each page flips to `live` after setup.
import type {
  Person, Task, DriveFolder, FileNode,
  CalEvent, MailThread, Contact, TaxInvoice, Tx, Repo, Commit, PullRequest,
  CashReceipt, IssuerProfile, SlackChannel, SlackMessage,
} from "./types";

export const SIHOON: Person = {
  id: "222d872b-594c-8117-a9a3-000264d2bfce",
  name: "Sihoon Kim",
  email: "ksihoon312@gmail.com",
};

// Pool of real Drive folders the user owns (for manual project↔folder linking fallback).
export const driveFolders: DriveFolder[] = [
  { id: "1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH", name: "호핑 Hoping (mentorship with 영준)", viewUrl: "https://drive.google.com/drive/folders/1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH" },
  { id: "1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT", name: "Knowledge store real", viewUrl: "https://drive.google.com/drive/folders/1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT" },
];

// Real folder contents captured from Drive (fallback when live creds absent).
export const folderTrees: Record<string, FileNode[]> = {
  "1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT": [
    {
      id: "1yDOe8nEvkvr9r7w0lgpiJvyEKP49B_-8",
      name: "The Myth of Continents — A Critique of Metageography.pdf",
      mimeType: "application/pdf",
      modifiedTime: "2025-10-07",
      owner: "ksihoon312@gmail.com",
      driveUrl: "https://drive.google.com/file/d/1yDOe8nEvkvr9r7w0lgpiJvyEKP49B_-8/view",
      source: "drive",
    },
    {
      id: "16eLmMQMcBNkmWpJDktZJMvG2UarMcEGv",
      name: "SebastianConrad_2016_WhatIsGlobalHistory.pdf",
      mimeType: "application/pdf",
      modifiedTime: "2025-09-07",
      owner: "ksihoon312@gmail.com",
      driveUrl: "https://drive.google.com/file/d/16eLmMQMcBNkmWpJDktZJMvG2UarMcEGv/view",
      source: "drive",
    },
  ],
  "1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH": [], // empty folder → demonstrates empty state
};

export const tasks: Task[] = [
  { id: "task-1", title: "Scaffold IRO Next.js shell (Projects + Tasks)", status: "Doing", priority: "High", assignees: [SIHOON], dueDate: "2026-05-31", projectName: "AI-Agent Builder", tags: ["build"], notes: "App shell, sidebar, two-column layout", notionUrl: "https://www.notion.so/370559dfde858104a7c9f414ac57e8cf" },
  { id: "task-2", title: "Wire Notion Projects + IRO Tasks into the dashboard", status: "Todo", priority: "High", assignees: [SIHOON], dueDate: "2026-06-02", projectName: "AI-Agent Builder", tags: ["build"], notes: "Live read via Notion API; relation Project↔Task", notionUrl: "https://www.notion.so/370559dfde858129b288d62e7450cee6" },
  { id: "task-3", title: "Build the Drive folder-mirror tree view", status: "Todo", priority: "Medium", assignees: [SIHOON], dueDate: "2026-06-04", projectName: "AI Engineering Pipeline", tags: ["build"], notes: "parentId walk; Notion↔Drive toggle", notionUrl: "https://www.notion.so/370559dfde85814099cbdfe41359a3a1" },
  { id: "task-4", title: "Set up Google OAuth (Drive API) credentials", status: "Todo", priority: "High", assignees: [SIHOON], dueDate: "2026-06-03", projectName: "AI-Agent Builder", tags: ["ops"], notes: "For the deployed app to read live Drive", notionUrl: "https://www.notion.so/370559dfde85817b8bb4d6131e6a5e82" },
  { id: "task-5", title: "Draft Onword DB raw→MD compile spec (Data Janitor)", status: "Review", priority: "Medium", assignees: [SIHOON], projectName: "AI Engineering Pipeline", tags: ["research"], notes: "Part 2 / M2 backend track", notionUrl: "https://www.notion.so/370559dfde8581fa9cb7e097bb2a56d8" },
];

// ── v0.3 SAMPLE data (clearly fake; replaced by live APIs once connected) ─────

// 📅 Calendar — spread across the next two weeks from 2026-05-31.
export const sampleEvents: CalEvent[] = [
  { id: "ev1", title: "Team standup", start: "2026-05-31T09:30:00+09:00", end: "2026-05-31T10:00:00+09:00", calendar: "Onword Team", attendees: ["Sihoon", "Jinho"], htmlLink: "https://calendar.google.com/" },
  { id: "ev2", title: "Client call — 안녕 (Education)", start: "2026-05-31T14:00:00+09:00", end: "2026-05-31T15:00:00+09:00", location: "Google Meet", calendar: "Onword Team", htmlLink: "https://calendar.google.com/" },
  { id: "ev3", title: "IRO demo prep", start: "2026-06-02T11:00:00+09:00", end: "2026-06-02T12:30:00+09:00", calendar: "Sihoon", htmlLink: "https://calendar.google.com/" },
  { id: "ev4", title: "Invoice / 세금계산서 review", start: "2026-06-03T16:00:00+09:00", end: "2026-06-03T16:30:00+09:00", calendar: "Onword Team", htmlLink: "https://calendar.google.com/" },
  { id: "ev5", title: "Workshop — AI ops (offsite)", start: "2026-06-05T00:00:00+09:00", allDay: true, calendar: "Onword Team", htmlLink: "https://calendar.google.com/" },
  { id: "ev6", title: "1:1 with 영준 (Hoping mentorship)", start: "2026-06-09T18:00:00+09:00", end: "2026-06-09T19:00:00+09:00", calendar: "Sihoon", htmlLink: "https://calendar.google.com/" },
  { id: "ev7", title: "Monthly close — finance", start: "2026-06-12T15:00:00+09:00", end: "2026-06-12T16:00:00+09:00", calendar: "Onword Team", htmlLink: "https://calendar.google.com/" },
];

// ✉️ Mail — unified sample inbox across the two work accounts.
export const sampleThreads: MailThread[] = [
  { id: "m1", account: "sihoon", fromName: "안녕 Education", fromEmail: "contact@annyeong.kr", subject: "6월 워크숍 일정 확정 요청", snippet: "안녕하세요, 6월 셋째 주 워크숍 일정 관련하여 회신 부탁드립니다…", date: "2026-05-31T08:12:00+09:00", unread: true, labels: ["Clients"], permalink: "https://mail.google.com/" },
  { id: "m2", account: "jinho", fromName: "Popbill 팝빌", fromEmail: "no-reply@popbill.com", subject: "[세금계산서] 전송 결과 안내", snippet: "발행하신 전자세금계산서가 국세청에 정상 전송되었습니다…", date: "2026-05-31T07:40:00+09:00", unread: true, labels: ["Tax"], permalink: "https://mail.google.com/" },
  { id: "m3", account: "sihoon", fromName: "GitHub", fromEmail: "notifications@github.com", subject: "[onword/iro] PR #12 ready for review", snippet: "feat: calendar + mail pages — 6 files changed…", date: "2026-05-30T22:05:00+09:00", labels: ["Dev"], permalink: "https://mail.google.com/" },
  { id: "m4", account: "jinho", fromName: "국민은행", fromEmail: "noreply@kbstar.com", subject: "[입금] 1,200,000원 입금 안내", snippet: "고객님 계좌에 입금이 완료되었습니다. 거래처: 안녕 Education…", date: "2026-05-30T16:21:00+09:00", labels: ["Banking"], permalink: "https://mail.google.com/" },
  { id: "m5", account: "sihoon", fromName: "Vive Partner", fromEmail: "hello@vive.io", subject: "Re: Content collab June", snippet: "Sounds great — let's lock the deliverables for the June sprint…", date: "2026-05-30T11:33:00+09:00", labels: ["Clients"], permalink: "https://mail.google.com/" },
  { id: "m6", account: "jinho", fromName: "Google Cloud", fromEmail: "cloud-noreply@google.com", subject: "Your billing account is active", snippet: "Vision API and other services are now enabled for project iro…", date: "2026-05-29T19:02:00+09:00", labels: ["Ops"], permalink: "https://mail.google.com/" },
  { id: "m7", account: "sihoon", fromName: "교내 AI Club", fromEmail: "club@campus.ac.kr", subject: "멘토링 세션 자료 공유", snippet: "지난 세션 자료와 다음 주 준비 사항을 공유드립니다…", date: "2026-05-29T09:45:00+09:00", permalink: "https://mail.google.com/" },
  { id: "m8", account: "jinho", fromName: "Notion", fromEmail: "team@makenotion.com", subject: "Weekly digest: Project Hub", snippet: "3 pages updated, 2 new tasks in IRO Tasks…", date: "2026-05-28T08:00:00+09:00", labels: ["Sources"], permalink: "https://mail.google.com/" },
];

// 🪪 Contacts (명함)
export const sampleContacts: Contact[] = [
  { id: "c1", name: "김지호", company: "Onword Lab", title: "Co-founder", phones: ["010-1234-5678"], emails: ["jinho.kim@onwordlab.com"], source: "google" },
  { id: "c2", name: "이수민", company: "안녕 Education", title: "대표", phones: ["010-2222-3333"], emails: ["sumin@annyeong.kr"], note: "교육 콘텐츠 협업", source: "card" },
  { id: "c3", name: "Alex Park", company: "Vive", title: "Partnerships", phones: ["010-9876-5432"], emails: ["alex@vive.io"], source: "card" },
  { id: "c4", name: "박영준", company: "Hoping", title: "Mentee", phones: ["010-4444-5555"], emails: ["youngjun@hoping.kr"], source: "manual" },
  { id: "c5", name: "정세무사", company: "세무법인 바른", title: "세무사", phones: ["02-555-1212"], emails: ["tax@barun.kr"], note: "세금계산서/홈택스 담당", source: "card" },
  { id: "c6", name: "최콘텐츠", company: "Content Studio", title: "PD", phones: ["010-7777-8888"], emails: ["pd@contentstudio.kr"], source: "google" },
];

// 🧾 Tax (세금계산서)
export const sampleInvoices: TaxInvoice[] = [
  { id: "t1", type: "sales", issueDate: "2026-05-29", partnerName: "안녕 Education", partnerBizNo: "123-45-67890", supplyAmount: 3000000, vat: 300000, total: 3300000, status: "issued", ntsConfirmNum: "20260529-410000-001" },
  { id: "t2", type: "sales", issueDate: "2026-05-20", partnerName: "Vive", partnerBizNo: "211-88-12345", supplyAmount: 1500000, vat: 150000, total: 1650000, status: "sent", ntsConfirmNum: "20260520-410000-002" },
  { id: "t3", type: "purchase", issueDate: "2026-05-18", partnerName: "Google Cloud Korea", partnerBizNo: "120-81-00000", supplyAmount: 90000, vat: 9000, total: 99000, status: "issued" },
  { id: "t4", type: "purchase", issueDate: "2026-05-12", partnerName: "세무법인 바른", partnerBizNo: "220-85-22222", supplyAmount: 200000, vat: 20000, total: 220000, status: "issued" },
  { id: "t5", type: "sales", issueDate: "2026-05-08", partnerName: "교내 AI Club", partnerBizNo: "134-82-33333", supplyAmount: 800000, vat: 80000, total: 880000, status: "draft" },
  { id: "t6", type: "purchase", issueDate: "2026-04-30", partnerName: "Notion Labs", supplyAmount: 60000, vat: 6000, total: 66000, status: "issued" },
];

// 💸 Banking (입출금)
export const sampleTransactions: Tx[] = [
  { id: "x1", date: "2026-05-30", direction: "in", counterparty: "안녕 Education", amount: 1200000, balance: 8420000, category: "매출", memo: "5월 교육 콘텐츠 1차", source: "bank", createdAt: "2026-05-30T16:21:00+09:00", updatedAt: "2026-05-30T16:21:00+09:00" },
  { id: "x2", date: "2026-05-28", direction: "out", counterparty: "Google Cloud", amount: 99000, balance: 7220000, category: "SaaS", memo: "Cloud/Vision", source: "csv", createdAt: "2026-05-28T10:00:00+09:00", updatedAt: "2026-05-28T10:00:00+09:00" },
  { id: "x3", date: "2026-05-25", direction: "out", counterparty: "세무법인 바른", amount: 220000, balance: 7319000, category: "세무", memo: "5월 기장료", source: "manual", createdAt: "2026-05-25T09:00:00+09:00", updatedAt: "2026-05-25T09:00:00+09:00" },
  { id: "x4", date: "2026-05-22", direction: "in", counterparty: "Vive", amount: 1650000, balance: 7539000, category: "매출", memo: "콘텐츠 협업 계약금", source: "bank", createdAt: "2026-05-22T14:00:00+09:00", updatedAt: "2026-05-22T14:00:00+09:00" },
  { id: "x5", date: "2026-05-20", direction: "out", counterparty: "배달의민족", amount: 38000, balance: 5889000, category: "식비", memo: "팀 점심", source: "receipt", receiptUrl: "", createdAt: "2026-05-20T12:30:00+09:00", updatedAt: "2026-05-20T12:30:00+09:00" },
  { id: "x6", date: "2026-05-15", direction: "out", counterparty: "AWS", amount: 142000, balance: 5927000, category: "SaaS", memo: "호스팅", source: "csv", createdAt: "2026-05-15T03:00:00+09:00", updatedAt: "2026-05-15T03:00:00+09:00" },
  { id: "x7", date: "2026-05-10", direction: "in", counterparty: "교내 AI Club", amount: 880000, balance: 6069000, category: "매출", memo: "멘토링 프로그램", source: "manual", createdAt: "2026-05-10T11:00:00+09:00", updatedAt: "2026-05-10T11:00:00+09:00" },
  { id: "x8", date: "2026-05-05", direction: "out", counterparty: "스타벅스", amount: 21000, balance: 5189000, category: "식비", memo: "미팅", source: "receipt", receiptUrl: "", createdAt: "2026-05-05T15:00:00+09:00", updatedAt: "2026-05-05T15:00:00+09:00" },
];

// 💻 Code (GitHub)
export const sampleRepos: Repo[] = [
  { id: "r1", name: "iro", fullName: "onword/iro", description: "Internal AI-native ops dashboard (this app)", updatedAt: "2026-05-31T01:20:00+09:00", openIssues: 4, url: "https://github.com/onword/iro", private: true, language: "TypeScript" },
  { id: "r2", name: "onword-db", fullName: "onword/onword-db", description: "Company Database → Onword Database compile pipeline", updatedAt: "2026-05-29T18:00:00+09:00", openIssues: 7, url: "https://github.com/onword/onword-db", private: true, language: "Python" },
  { id: "r3", name: "agents", fullName: "onword/agents", description: "The 6 ops agents (Data Janitor, Memory Curator, …)", updatedAt: "2026-05-27T10:00:00+09:00", openIssues: 2, url: "https://github.com/onword/agents", private: true, language: "TypeScript" },
  { id: "r4", name: "annyeong-content", fullName: "onword/annyeong-content", description: "안녕 Education content site", updatedAt: "2026-05-24T13:00:00+09:00", openIssues: 1, url: "https://github.com/onword/annyeong-content", private: true, language: "TypeScript" },
  { id: "r5", name: "infra", fullName: "onword/infra", description: "Deploy + Vercel/Supabase config", updatedAt: "2026-05-20T09:00:00+09:00", openIssues: 0, url: "https://github.com/onword/infra", private: true, language: "HCL" },
];
export const sampleCommits: Commit[] = [
  { sha: "a1b2c3d", message: "feat(calendar): agenda + month view", author: "sihoon", date: "2026-05-31T01:20:00+09:00", repo: "onword/iro", url: "https://github.com/onword/iro/commit/a1b2c3d" },
  { sha: "e4f5g6h", message: "feat(mail): unified inbox for two accounts", author: "sihoon", date: "2026-05-31T00:55:00+09:00", repo: "onword/iro", url: "https://github.com/onword/iro/commit/e4f5g6h" },
  { sha: "i7j8k9l", message: "chore(seed): sample data for v0.3 pages", author: "jinho", date: "2026-05-30T23:40:00+09:00", repo: "onword/iro", url: "https://github.com/onword/iro/commit/i7j8k9l" },
  { sha: "m1n2o3p", message: "feat(compile): markdown chunker for Drive docs", author: "jinho", date: "2026-05-29T18:00:00+09:00", repo: "onword/onword-db", url: "https://github.com/onword/onword-db/commit/m1n2o3p" },
  { sha: "q4r5s6t", message: "fix(janitor): dedup near-identical notes", author: "sihoon", date: "2026-05-27T10:00:00+09:00", repo: "onword/agents", url: "https://github.com/onword/agents/commit/q4r5s6t" },
  { sha: "u7v8w9x", message: "docs: onboarding agent spec", author: "jinho", date: "2026-05-26T14:00:00+09:00", repo: "onword/agents", url: "https://github.com/onword/agents/commit/u7v8w9x" },
];
export const samplePRs: PullRequest[] = [
  { id: "pr1", number: 12, title: "feat: calendar + mail pages", repo: "onword/iro", author: "sihoon", state: "open", updatedAt: "2026-05-31T01:30:00+09:00", url: "https://github.com/onword/iro/pull/12" },
  { id: "pr2", number: 9, title: "Onword DB: HippoRAG micro-graph index", repo: "onword/onword-db", author: "jinho", state: "open", updatedAt: "2026-05-29T17:10:00+09:00", url: "https://github.com/onword/onword-db/pull/9" },
  { id: "pr3", number: 5, title: "Memory Auditor: drift detection", repo: "onword/agents", author: "sihoon", state: "open", updatedAt: "2026-05-27T09:30:00+09:00", url: "https://github.com/onword/agents/pull/5" },
  { id: "pr4", number: 3, title: "Supabase migration for projects store", repo: "onword/infra", author: "jinho", state: "merged", updatedAt: "2026-05-21T12:00:00+09:00", url: "https://github.com/onword/infra/pull/3" },
];

// 🧾 Tax — 내 사업자 정보(공급자) + 현금영수증 샘플 (셀프 발행 콘솔용)
export const sampleIssuerProfile: IssuerProfile = {
  bizNo: "555-12-34567",
  corpName: "온워드랩 Onword Lab",
  ceoName: "김시훈",
  address: "서울특별시 강남구 테헤란로 …",
  bizType: "정보통신업",
  bizItem: "소프트웨어 개발 및 공급",
  email: "tax@onwordlab.com",
  certRegistered: false, // 테스트 모드: 인증서 없이 발행 가능
  updatedAt: "2026-05-30T00:00:00+09:00",
};

export const sampleCashReceipts: CashReceipt[] = [
  { id: "cr1", tradeDate: "2026-05-28", purpose: "지출증빙", identityNum: "123-45-67890", supplyAmount: 50000, vat: 5000, total: 55000, status: "issued", ntsConfirmNum: "CR20260528-00010001", createdAt: "2026-05-28T10:00:00+09:00" },
  { id: "cr2", tradeDate: "2026-05-22", purpose: "소득공제", identityNum: "010-2222-3333", supplyAmount: 30000, vat: 3000, total: 33000, status: "issued", ntsConfirmNum: "CR20260522-00070007", createdAt: "2026-05-22T15:00:00+09:00" },
];

// 💬 Slack — sample workspace (channels + a threaded conversation)
export const sampleChannels: SlackChannel[] = [
  { id: "C001", name: "general", topic: "회사 전체 공지", memberCount: 3 },
  { id: "C002", name: "iro-dev", topic: "IRO 대시보드 개발", memberCount: 3, unread: 2 },
  { id: "C003", name: "clients", topic: "고객사 커뮤니케이션", memberCount: 3 },
  { id: "C004", name: "random", topic: "잡담 · 가벼운 이야기", memberCount: 3 },
];

export const sampleSlackMessages: SlackMessage[] = [
  // #general
  { ts: "1717286400.0001", channel: "C001", userId: "U1", userName: "Sihoon", text: "이번 주 데모는 수요일 3시입니다 🎯", date: "2026-06-01T09:00:00+09:00" },
  { ts: "1717286700.0002", channel: "C001", userId: "U2", userName: "Jinho", text: "넵 준비할게요!", date: "2026-06-01T09:05:00+09:00", reactions: [{ emoji: "+1", count: 2 }] },
  // #iro-dev — parent .1001 has a 2-reply thread
  { ts: "1717290000.1001", channel: "C002", userId: "U1", userName: "Sihoon", text: "Tax 셀프 발행 콘솔 올렸어요. 확인 부탁 🙏", date: "2026-06-01T10:00:00+09:00", replyCount: 2 },
  { ts: "1717290060.1002", channel: "C002", userId: "U2", userName: "Jinho", text: "오 정발행 + 현금영수증 둘 다 되네요 👍", date: "2026-06-01T10:01:00+09:00", threadTs: "1717290000.1001" },
  { ts: "1717290120.1003", channel: "C002", userId: "U1", userName: "Sihoon", text: "넵, 이제 팝빌 테스트 연동만 남았어요.", date: "2026-06-01T10:02:00+09:00", threadTs: "1717290000.1001" },
  { ts: "1717293600.1004", channel: "C002", userId: "U2", userName: "Jinho", text: "Slack 연동도 이번 주에 붙여봐요.", date: "2026-06-01T11:00:00+09:00", reactions: [{ emoji: "rocket", count: 2 }] },
  // #clients
  { ts: "1717297200.2001", channel: "C003", userId: "U1", userName: "Sihoon", text: "안녕 Education 6월 워크숍 일정 확정됐습니다.", date: "2026-06-01T12:00:00+09:00" },
];
