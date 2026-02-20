import { Folder } from "@/types/folder";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate } from "./types";

export const folderStorage = {
    /**
    * Folders (CRUD)
    */
    async getFolders(): Promise<Folder[]> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("folders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching folders:", error);
            return [];
        }

        return (data || []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            icon: row.icon ?? "",
            color: row.color ?? "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    async addFolder(folder: Folder): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const row: TablesInsert<"folders"> = {
            id: folder.id,
            name: folder.name,
            icon: folder.icon ?? null,
            color: folder.color ?? null,
            user_id: user.id,
            created_at: folder.createdAt,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("folders").insert(row);

        if (error) {
            console.error("Error adding folder:", error);
            throw error;
        }
    },

    async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
            
        const row: TablesUpdate<"folders"> = {};
        if ("name" in updates) row.name = updates.name;
        if ("icon" in updates) row.icon = updates.icon ?? null;
        if ("color" in updates) row.color = updates.color ?? null;

        const { error } = await supabase
            .from("folders")
            .update(row)
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating folder:", error);
            throw error;
        }
    },

    async deleteFolder(id: string): Promise<void> {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        await supabase
            .from("tasks")
            .update({ folder_id: null })
            .eq("folder_id", id)
            .eq("user_id", user.id);

        const { error } = await supabase
            .from("folders")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            console.error("Error deleting folder:", error);
            throw error;
        }
    },
}
