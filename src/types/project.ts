export type TaskStatus = "todo" | "doing" | "done";

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  createdAt: string;
  deadline?: string; // ISO date string (YYYY-MM-DD)
}
