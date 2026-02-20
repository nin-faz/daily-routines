export enum Status {
  TODO = "todo",
  DONE = "done",
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  folderId?: string;
  status: Status;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}