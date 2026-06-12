import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, ClipboardList } from "lucide-react";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import AdminLayout from "@/views/components/admin/AdminLayout";
import AdminFilterBar from "@/views/components/admin/AdminFilterBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { supabase } from "@/data/integrations/supabase/client";
import { Database } from "@/data/integrations/supabase/types";
import { toast } from "sonner";

/**
 * Type d'affichage enrichi pour les tâches en administration.
 * Utilise les types générés de Supabase pour garantir la synchronisation avec la BDD.
 */
type AdminTaskDisplay = Database["public"]["Tables"]["tasks"]["Row"] & {
  folder_name: string | null;
  owner_email: string | null;
};

const AdminTasks = () => {
  usePageTitle("Tâches · Admin");
  const [tasks, setTasks] = useState<AdminTaskDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Récupération atomique des données nécessaires
        const [tasksRes, foldersRes, profilesRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("folders").select("id, name"),
          supabase.from("profiles").select("id, email"),
        ]);

        if (tasksRes.error) throw tasksRes.error;

        const tasksData = tasksRes.data || [];
        const folders = foldersRes.data || [];
        const profiles = profilesRes.data || [];

        // On enrichit l'objet tâche avec les métadonnées de dossiers et profils
        const enriched: AdminTaskDisplay[] = tasksData.map((t) => ({
          ...t,
          folder_name: folders.find((f) => f.id === t.folder_id)?.name || null,
          owner_email: profiles.find((p) => p.id === t.user_id)?.email || null,
        }));

        if (!mounted) return;
        setTasks(enriched);
      } catch (err: unknown) {
        console.error("Audit Admin Tasks Failure:", err);
        toast.error("Impossible de charger les données administratives.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAdminData();
    return () => {
      mounted = false;
    };
  }, []);

  // Dérivations mémoïsées pour optimiser les performances (Pattern DRY)
  const ownersOptions = useMemo(() => {
    const emails = Array.from(
      new Set(tasks.map((t) => t.owner_email).filter(Boolean)),
    );
    return emails.sort().map((email) => ({ value: email!, label: email! }));
  }, [tasks]);

  const foldersOptions = useMemo(() => {
    const uniqFolders = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.folder_id)
        uniqFolders.set(t.folder_id, t.folder_name || t.folder_id);
    });
    return Array.from(uniqFolders.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [tasks]);

  const statusOptions = useMemo(() => {
    const uniqStatuses = Array.from(new Set(tasks.map((t) => t.status)));
    return uniqStatuses.map((s) => ({
      value: s,
      label: s === "todo" ? "À faire" : s === "done" ? "Terminé" : s,
    }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const searchQuery = (filters.q || "").toLowerCase();
    return tasks.filter((t) => {
      const matchQ =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery) ||
        (t.owner_email || "").toLowerCase().includes(searchQuery);

      const matchOwner = !filters.owner || t.owner_email === filters.owner;
      const matchFolder = !filters.folder || t.folder_id === filters.folder;
      const matchStatus = !filters.status || t.status === filters.status;

      return matchQ && matchOwner && matchFolder && matchStatus;
    });
  }, [tasks, filters]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Tâches Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Audit et supervision du flux de productivité global.
          </p>
        </header>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
                Index des tâches ({filteredTasks.length})
              </CardTitle>
              <AdminFilterBar
                owners={ownersOptions}
                folders={foldersOptions}
                statuses={statusOptions}
                onChange={setFilters}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4" role="status" aria-label="Chargement en cours">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Synchronisation avec Supabase...
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center gap-2">
                <p className="text-muted-foreground font-medium">
                  Aucune donnée correspondante.
                </p>
                <span className="text-xs text-muted-foreground/60">
                  Essayez d'ajuster vos filtres de recherche.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-foreground">
                        Titre
                      </TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead className="text-right">
                        Date de création
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((t) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-medium max-w-[200px]">
                          <div className="truncate" title={t.title}>
                            {t.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              t.status === "done" ? "default" : "outline"
                            }
                            className={
                              t.status === "done"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : ""
                            }
                          >
                            {t.status === "todo" ? "À faire" : "Terminé"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.folder_id ? (
                            <span className="text-muted-foreground font-medium text-xs">
                              {t.folder_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30 text-[10px] uppercase font-bold tracking-widest italic">
                              Inbox
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {t.owner_email || "N/A"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                          {format(new Date(t.created_at), "dd MMM yyyy", {
                            locale: fr,
                          })}
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
