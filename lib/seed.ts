// Real-data snapshot captured 2026-05-30 from the live Notion + Google Drive
// connections (workspace: Sihoon Kim / ksihoon312@gmail.com).
// Used when no NOTION_TOKEN / GOOGLE_ACCESS_TOKEN env is set (see lib/data.ts).
import type { Person, Project, Task, DriveFolder, FileNode } from "./types";

export const SIHOON: Person = {
  id: "222d872b-594c-8117-a9a3-000264d2bfce",
  name: "Sihoon Kim",
  email: "ksihoon312@gmail.com",
};

export const projects: Project[] = [
  {
    id: "ai-engineering-pipeline",
    name: "AI Engineering Pipeline",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/2f3559dfde8580f1bbbef5dac5eb88e5",
    notionPageId: "2f3559dfde8580f1bbbef5dac5eb88e5",
    driveFolderId: "1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT", // "Knowledge store real"
  },
  {
    id: "urban-brand-strategies",
    name: "Urban Brand Strategies",
    status: "Not started",
    assignees: [SIHOON],
    notionUrl: "https://www.notion.so/2a1559dfde85807e8349cb98d3fa02d1",
    notionPageId: "2a1559dfde85807e8349cb98d3fa02d1",
    driveFolderId: "1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH", // "호핑 Hoping"
  },
  {
    id: "ai-agent-builder",
    name: "AI-Agent Builder",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/28a559dfde85803a93e6f806b5a1255c",
    notionPageId: "28a559dfde85803a93e6f806b5a1255c",
    driveFolderId: null,
  },
  {
    id: "main-extract-notion-voice",
    name: "메인 글 추출 + 노션 database에 넣기 + 음성변환",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/2f3559dfde8580ddb6abef868381db77",
    notionPageId: "2f3559dfde8580ddb6abef868381db77",
    driveFolderId: null,
  },
  {
    id: "education-project",
    name: "교육 프로젝트",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/2a6559dfde8580eeb103cce4fd46063e",
    notionPageId: "2a6559dfde8580eeb103cce4fd46063e",
    driveFolderId: null,
  },
  {
    id: "ai-persona-project",
    name: "AI Persona Project",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/2ff559dfde8580b7b946c06c53481920",
    notionPageId: "2ff559dfde8580b7b946c06c53481920",
    driveFolderId: null,
  },
  {
    id: "principle-investing-app",
    name: "원칙 투자앱",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/301559dfde858047a759f2fc20cb1c40",
    notionPageId: "301559dfde858047a759f2fc20cb1c40",
    driveFolderId: null,
  },
  {
    id: "untitled-project",
    name: "(Untitled project)",
    status: "Not started",
    assignees: [],
    notionUrl: "https://www.notion.so/304559dfde85801db21bdb5c0968dec9",
    notionPageId: "304559dfde85801db21bdb5c0968dec9",
    driveFolderId: null,
  },
];

// Pool of real Drive folders the user owns (for manual project↔folder linking).
export const driveFolders: DriveFolder[] = [
  { id: "1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH", name: "호핑 Hoping (mentorship with 영준)", viewUrl: "https://drive.google.com/drive/folders/1tZE119Ay7DasdecqDO9-Eju_4R3OvnAH" },
  { id: "1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT", name: "Knowledge store real", viewUrl: "https://drive.google.com/drive/folders/1-LwzkeTMnoQrJKhJRnzvWtVdHhMTynlT" },
  { id: "1cyLS17UE_B209ocoVZoGsGHn3VJfWPSQ", name: "Untitled", viewUrl: "https://drive.google.com/drive/folders/1cyLS17UE_B209ocoVZoGsGHn3VJfWPSQ" },
  { id: "1l-0JZSQsyePMe05R1W7pyn1zmc6TXTG0", name: "WB Retreat", viewUrl: "https://drive.google.com/drive/folders/1l-0JZSQsyePMe05R1W7pyn1zmc6TXTG0" },
];

// Real folder contents captured from Drive.
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

// Notion page content snapshots (rendered in the Notion view of project detail).
export const notionSnapshots: Record<string, string> = {
  "urban-brand-strategies": `**Data-driven PMF**

- 야외에서 일을 할 수 있는 인프라 구축
  - 날씨 좋은 wework
  - 햇빛 잘 드는 곳에, 비닐하우스처럼 밖과 안의 경계가 모호한 공간
  - 햇빛을 충분히 볼 수 있는 환경!

Remote work has been viral.
한계: 너무 공공장소이면 지나가는 사람들의 시선이 문제가 된다.

프로젝트형 enterprise — creativeness와 실용성이 합쳐지면 재미있는 브랜드가 될 것 같다.`,
};

export const tasks: Task[] = [
  { id: "task-1", title: "Scaffold IRO Next.js shell (Projects + Tasks)", status: "Doing", priority: "High", assignees: [SIHOON], dueDate: "2026-05-31", projectId: "ai-agent-builder", projectName: "AI-Agent Builder", tags: ["build"], notes: "App shell, sidebar, two-column layout", notionUrl: "https://www.notion.so/370559dfde858104a7c9f414ac57e8cf" },
  { id: "task-2", title: "Wire Notion Projects + IRO Tasks into the dashboard", status: "Todo", priority: "High", assignees: [SIHOON], dueDate: "2026-06-02", projectId: "ai-agent-builder", projectName: "AI-Agent Builder", tags: ["build"], notes: "Live read via Notion API; relation Project↔Task", notionUrl: "https://www.notion.so/370559dfde858129b288d62e7450cee6" },
  { id: "task-3", title: "Build the Drive folder-mirror tree view", status: "Todo", priority: "Medium", assignees: [SIHOON], dueDate: "2026-06-04", projectId: "ai-engineering-pipeline", projectName: "AI Engineering Pipeline", tags: ["build"], notes: "parentId walk; Notion↔Drive toggle", notionUrl: "https://www.notion.so/370559dfde85814099cbdfe41359a3a1" },
  { id: "task-4", title: "Set up Google OAuth (Drive API) credentials", status: "Todo", priority: "High", assignees: [SIHOON], dueDate: "2026-06-03", projectId: "ai-agent-builder", projectName: "AI-Agent Builder", tags: ["ops"], notes: "For the deployed app to read live Drive", notionUrl: "https://www.notion.so/370559dfde85817b8bb4d6131e6a5e82" },
  { id: "task-5", title: "Draft Onword DB raw→MD compile spec (Data Janitor)", status: "Review", priority: "Medium", assignees: [SIHOON], projectId: "ai-engineering-pipeline", projectName: "AI Engineering Pipeline", tags: ["research"], notes: "Part 2 / M2 backend track", notionUrl: "https://www.notion.so/370559dfde8581fa9cb7e097bb2a56d8" },
];
