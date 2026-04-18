export type ProjectStatus = "Active" | "Completed" | "On Hold";

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  startDate: string; // "2026-03-01"
  dueDate: string;   // "2026-03-30"
  status: ProjectStatus;
  memberCount: number;
}