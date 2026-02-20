import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import { useMemo } from "react";

const AdminTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [tasksRes, foldersRes, profilesRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("id, title, status, folder_id, user_id, created_at")
            .order("created_at", { ascending: false }),
          supabase.from("folders").select("id, name"),
          supabase.from("profiles").select("id, email"),
        ]);

        const tasksData = tasksRes.data || [];
        const folders = (foldersRes.data || []) as any[];
        const profiles = (profilesRes.data || []) as any[];

        // Enrich tasks with folder name and owner email for clearer display
        const enriched = tasksData.map((t: any) => ({
          ...t,
          folder_name: folders.find((f) => f.id === t.folder_id)?.name || null,
          owner_email: profiles.find((p) => p.id === t.user_id)?.email || null,
        }));

        if (!mounted) return;
        setTasks(enriched);
      } catch (err) {
        console.error("Error loading admin tasks:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const owners = useMemo(() => {
    const uniq: Record<string, string> = {};
    tasks.forEach((t) => {
      if (t.owner_email) uniq[t.owner_email] = t.owner_email;
    });
    return Object.keys(uniq).map((k) => ({ value: k, label: k }));
  }, [tasks]);

  const folders = useMemo(() => {
    const uniq: Record<string, string> = {};
    tasks.forEach((t) => {
      if (t.folder_id) uniq[t.folder_id] = t.folder_name || t.folder_id;
    });
    return Object.keys(uniq).map((k) => ({ value: k, label: uniq[k] }));
  }, [tasks]);

  const statuses = useMemo(() => {
    const uniq: Record<string, string> = {};
    tasks.forEach((t) => {
      if (t.status) uniq[t.status] = t.status;
    });
    return Object.keys(uniq).map((k) => ({ value: k, label: k }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const q = (filters.q || "").toLowerCase();
    return tasks.filter((t) => {
      if (
        q &&
        !(t.title || "").toLowerCase().includes(q) &&
        !(t.owner_email || "").toLowerCase().includes(q)
      )
        return false;
      if (filters.owner && t.owner_email !== filters.owner) return false;
      if (filters.folder && t.folder_id !== filters.folder) return false;
      if (filters.status && t.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tâches</h1>
          <p className="text-muted-foreground">Liste des tâches (admin)</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Liste des tâches
            </CardTitle>
            <div className="mt-3">
              <AdminFilterBar
                owners={owners}
                folders={folders}
                statuses={statuses}
                onChange={(f) => setFilters(f)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune tâche trouvée
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Créé le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((t) => (
                      <TableRow
                        key={t.id}
                        className="transition-colors hover:bg-primary/5"
                      >
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>
                          <Badge className="capitalize">
                            {t.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.folder_id ? (
                            <Link
                              to={`/folder/${t.folder_id}`}
                              className="text-primary hover:underline"
                            >
                              {t.folder_name || t.folder_id}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.owner_email || "-"}
                        </TableCell>
                        <TableCell>
                          {t.created_at
                            ? format(new Date(t.created_at), "dd MMM yyyy", {
                                locale: fr,
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
