import { Project, ProjectTask, TaskStatus } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const PROJECTS_KEY = "daily-routines-projects";
const TASKS_KEY = "daily-routines-project-tasks";

export const projectStorage = {
  async getProjects(): Promise<Project[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const stored = localStorage.getItem(PROJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    }));
  },

  // Keep a local fallback for unauthenticated sessions
  saveProjects(projects: Project[]) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  async addProject(project: Project) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const projects = await this.getProjects();
      projects.push(project);
      this.saveProjects(projects);
      return;
    }

    const row: TablesInsert<"projects"> = {
      id: project.id,
      title: project.title,
      description: project.description ?? null,
      user_id: user.id,
      created_at: project.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("projects").insert(row);
    if (error) {
      console.error("Error adding project:", error);
      // fallback to local
      const projects = await this.getProjects();
      projects.push(project);
      this.saveProjects(projects);
    }
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const projects = await this.getProjects();
      const index = projects.findIndex((p) => p.id === id);
      if (index !== -1) {
        const updatedProject: Project = { ...projects[index], ...updates };
        projects[index] = updatedProject;
        this.saveProjects(projects);
      }
      return;
    }

    const row: TablesUpdate<"projects"> = {} as any;
    if ("title" in updates) row.title = updates.title;
    if ("description" in updates) row.description = updates.description ?? null;

    const { error } = await supabase
      .from("projects")
      .update(row)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating project:", error);
    }
  },

  async deleteProject(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const remainingProjects = (await this.getProjects()).filter((p) => p.id !== id);
      this.saveProjects(remainingProjects);
      const remainingTasks = (await this.getTasks()).filter((t) => t.projectId !== id);
      this.saveTasks(remainingTasks);
      return;
    }

    // Delete tasks first to satisfy FK constraints
    const { error: tasksError } = await supabase
      .from("tasks")
      .delete()
      .eq("project_id", id)
      .eq("user_id", user.id);

    if (tasksError) {
      console.error("Error deleting tasks for project:", tasksError);
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting project:", error);
    }
  },

  async getTasks(): Promise<ProjectTask[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const stored = localStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status as TaskStatus,
      projectId: row.project_id,
      createdAt: row.created_at,
      deadline: row.deadline ? row.deadline.split("T")[0] : undefined,
    }));
  },

  saveTasks(tasks: ProjectTask[]) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  async getTasksByProject(projectId: string): Promise<ProjectTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter((t) => t.projectId === projectId);
  },

  async addTask(task: ProjectTask) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const tasks = await this.getTasks();
      tasks.push(task);
      this.saveTasks(tasks);
      return;
    }

    const row: TablesInsert<"tasks"> = {
      id: task.id,
      title: task.title,
      description: null,
      status: task.status,
      user_id: user.id,
      project_id: task.projectId,
      created_at: task.createdAt,
      updated_at: new Date().toISOString(),
      deadline: task.deadline
        ? new Date(task.deadline + "T00:00:00Z").toISOString()
        : null,
    };

    const { error } = await supabase.from("tasks").insert(row);
    if (error) {
      console.error("Error adding task:", error);
      const tasks = await this.getTasks();
      tasks.push(task);
      this.saveTasks(tasks);
    }
  },

  async updateTask(id: string, updates: Partial<ProjectTask>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const tasks = await this.getTasks();
      const index = tasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        const updatedTask: ProjectTask = { ...tasks[index], ...updates };
        tasks[index] = updatedTask;
        this.saveTasks(tasks);
      }
      return;
    }

    const row: TablesUpdate<"tasks"> = {} as any;
    if ("title" in updates) row.title = updates.title;
    if ("status" in updates) row.status = updates.status;
    if ("deadline" in updates) row.deadline = updates.deadline ? new Date(updates.deadline + "T00:00:00Z").toISOString() : null;

    const { error } = await supabase
      .from("tasks")
      .update(row)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating task:", error);
    }
  },

  async updateTaskStatus(id: string, status: TaskStatus) {
    await this.updateTask(id, { status });
  },

  async deleteTask(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const remainingTasks = (await this.getTasks()).filter((t) => t.id !== id);
      this.saveTasks(remainingTasks);
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting task:", error);
    }
  },

  async getTasksWithDeadlineOnDate(date: string): Promise<ProjectTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter((t) => t.deadline === date);
  },

  async hasDeadlineOnDate(date: string): Promise<boolean> {
    const tasks = await this.getTasks();
    return tasks.some((t) => t.deadline === date);
  },

  async getDeadlinesForMonth(year: number, month: number): Promise<Set<string>> {
    const deadlines = new Set<string>();
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    (await this.getTasks()).forEach((task) => {
      if (task.deadline && task.deadline >= startDate && task.deadline <= endDate) {
        deadlines.add(task.deadline);
      }
    });

    return deadlines;
  },

  async getDeadlinesForWeek(startDate: string, endDate: string): Promise<Set<string>> {
    const deadlines = new Set<string>();

    (await this.getTasks()).forEach((task) => {
      if (task.deadline && task.deadline >= startDate && task.deadline <= endDate) {
        deadlines.add(task.deadline);
      }
    });

    return deadlines;
  },
};