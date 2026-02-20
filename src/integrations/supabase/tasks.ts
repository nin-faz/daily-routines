
import { Status, Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate } from "./types";

export const taskStorage = {
    /**
     * Tasks (CRUD)
     */
    async getTasks(): Promise<Task[]> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }
        return (data || []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description ?? "",
            status: row.status as Status,
            folderId: row.folder_id ?? "",
            deadline: row.deadline ? row.deadline.split("T")[0] : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at ?? row.created_at,
        }));
    },

    async addTask(task: Task): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const row: TablesInsert<"tasks"> = {
            id: task.id,
            user_id: user.id,
            title: task.title,
            description: task.description ?? null,
            folder_id: task.folderId ?? null,
            status: task.status,
            deadline: task.deadline ? new Date(task.deadline + "T00:00:00Z").toISOString() : null,
        };

        const { error } = await supabase.from("tasks").insert(row);

        if (error) {
            console.error("Error adding task:", error);
            throw error;
        }
    },

    async updateTask(id: string, updates: Partial<Task>): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const row: TablesUpdate<"tasks"> = {};
        if ("title" in updates) row.title = updates.title;
        if ("description" in updates) row.description = updates.description ?? null;
        if ("status" in updates) row.status = updates.status;
        if ("folderId" in updates) row.folder_id = updates.folderId ?? null;
        if ("deadline" in updates) row.deadline = updates.deadline ? new Date(updates.deadline + "T00:00:00Z").toISOString() : null;

        const { error } = await supabase
            .from("tasks")
            .update(row)
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    },

    async toggleTaskComplete(id: string): Promise<void> {
        const tasks = await this.getTasks();
        const task = tasks.find((t) => t.id === id);
        if (task) {
            await this.updateTask(id, { status: (task.status === "todo" ? "done" : "todo") as Status });
        }
    },

    async deleteTask(id: string): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    },
}