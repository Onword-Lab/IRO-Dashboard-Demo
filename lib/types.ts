export type ProjectStatus = "Not started" | "In progress" | "Done";
export type TaskStatus = "Todo" | "Doing" | "Review" | "Done";
export type Priority = "High" | "Medium" | "Low";

export interface Person {
  id: string;
  name: string;
  email?: string;
}

export interface Project {
  id: string;            // slug used in URLs
  name: string;
  status: ProjectStatus;
  assignees: Person[];
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  team?: string[];
  notionUrl: string;     // notion_page_ref — the project's Notion page
  notionPageId: string;
  driveFolderId?: string | null;   // drive_folder_ref — linked Company-DB folder
}

export interface FileNode {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  owner?: string;
  driveUrl?: string;
  source: "drive" | "notion" | "md" | "commit" | "session";
  children?: FileNode[];
}

export interface DriveFolder {
  id: string;
  name: string;
  viewUrl: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: Priority;
  assignees: Person[];
  dueDate?: string;
  projectId?: string;     // slug of the linked project
  projectName?: string;
  tags: string[];
  notes?: string;
  source?: string;
  notionUrl: string;
}
