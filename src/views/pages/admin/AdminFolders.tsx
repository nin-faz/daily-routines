import { useAdminFolders } from "@/application/hooks/useAdminQueries";
import AdminLayout from "@/views/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Loader2, FolderKanban } from "lucide-react";
import AdminFilterBar from "@/views/components/admin/AdminFilterBar";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdminFolders = () => {
  usePageTitle("Admin — Dossiers");
  const { data: folders = [], isLoading: loading } = useAdminFolders();

  const [filters, setFilters] = useState<Record<string, string>>({});

  const owners = useMemo(() => {
    const uniq: Record<string, string> = {};
    folders.forEach((f) => {
      if (f.owner_email) uniq[f.owner_email] = f.owner_email;
    });
    return Object.keys(uniq).map((k) => ({ value: k, label: k }));
  }, [folders]);

  const filteredFolders = useMemo(() => {
    const q = (filters.q || "").toLowerCase();
    return folders.filter((f) => {
      if (
        q &&
        !(f.name || "").toLowerCase().includes(q) &&
        !(f.owner_email || "").toLowerCase().includes(q)
      )
        return false;
      if (filters.owner && f.owner_email !== filters.owner) return false;
      return true;
    });
  }, [folders, filters]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dossiers</h1>
          <p className="text-muted-foreground">
            Tous les dossiers des utilisateurs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" aria-hidden="true" />
              Liste des dossiers ({folders.length})
            </CardTitle>
            <div className="mt-3">
              <AdminFilterBar owners={owners} onChange={(f) => setFilters(f)} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8" role="status" aria-label="Chargement en cours">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : filteredFolders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun dossier trouvé
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Tâches</TableHead>
                      <TableHead>Créé le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFolders.map((folder) => {
                      const initials = (folder.owner_email || "?")
                        .split("@")[0]
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <TableRow
                          key={folder.id}
                          className="transition-colors hover:bg-primary/5"
                        >
                          <TableCell className="font-medium">
                            <span className="font-bold text-primary mr-2">
                              {folder.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <span>{folder.owner_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-primary/10 text-primary border border-primary/30">
                              {folder.task_count}{" "}
                              {folder.task_count > 1 ? "tâches" : "tâche"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(folder.created_at),
                              "dd MMM yyyy",
                              {
                                locale: fr,
                              },
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default AdminFolders;
