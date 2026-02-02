import { useAdminProjects } from "@/hooks/useAdminQueries";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdminProjects = () => {
  const { data: projects = [], isLoading: loading } = useAdminProjects();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-muted-foreground">
            Tous les projets des utilisateurs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Liste des projets ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun projet trouvé
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Tâches</TableHead>
                      <TableHead>Créé le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => {
                      const initials = (project.owner_email || "?")
                        .split("@")[0]
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <TableRow
                          key={project.id}
                          className="transition-colors hover:bg-primary/5"
                        >
                          <TableCell className="font-medium">
                            <span className="font-bold text-primary mr-2">
                              {project.title}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {project.description || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <span>{project.owner_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-primary/10 text-primary border border-primary/30">
                              {project.task_count}{" "}
                              {project.task_count > 1 ? "tâches" : "tâche"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(project.created_at),
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

export default AdminProjects;
