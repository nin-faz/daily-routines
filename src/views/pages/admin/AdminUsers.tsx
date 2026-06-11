import { useAdminUsers } from "@/application/hooks/useAdminQueries";
import { updateAdminRole } from "@/data/repositories/admin";
import { deleteUser } from "@/data/repositories/user";
import AdminLayout from "@/views/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/application/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Loader2, Shield, ShieldOff, User, Trash2 } from "lucide-react";
import AdminFilterBar from "@/views/components/admin/AdminFilterBar";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const AdminUsers = () => {
  usePageTitle("Utilisateurs · Admin");
  const { data: users = [], isLoading: loading, refetch } = useAdminUsers();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredUsers = useMemo(() => {
    const q = (filters.q || "").toLowerCase();
    return users.filter((u) => {
      if (
        q &&
        !(
          (u.display_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        )
      )
        return false;
      if (filters.role) {
        const has = u.roles.includes(filters.role);
        if (!has) return false;
      }
      return true;
    });
  }, [users, filters]);

  // Change le rôle admin et rafraîchit la liste via React Query
  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
    const isAdmin = currentRoles.includes("admin");
    try {
      const errorMsg = await updateAdminRole(userId, !isAdmin);
      if (errorMsg) {
        toast({
          title: "Erreur",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        toast({
          title: isAdmin ? "Rôle retiré" : "Rôle ajouté",
          description: isAdmin
            ? "Le rôle admin a été retiré"
            : "Le rôle admin a été ajouté",
        });
        refetch();
      }
    } catch (error) {
      console.error("Error toggling role:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  };

  // Trouver l'utilisateur courant (celui qui est connecté)
  // On suppose que le premier user dans la liste avec le rôle admin et user_id === id est le courant
  const currentUser = users.find(
    (u) => u.roles.includes("admin") && u.id === u.user_id,
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs rôles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              Liste des utilisateurs ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <div className="px-6 mt-2">
            <AdminFilterBar
              roles={[
                { value: "admin", label: "admin" },
                { value: "user", label: "user" },
              ]}
              onChange={(f) => setFilters(f)}
            />
          </div>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8" role="status" aria-label="Chargement en cours">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun utilisateur trouvé
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôles</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const isAdmin = user.roles.includes("admin");
                      const initials = (user.display_name || user.email || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const isCurrentUser =
                        currentUser && user.id === currentUser.id;
                      return (
                        <TableRow
                          key={user.id}
                          className="transition-colors hover:bg-primary/5"
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            {user.display_name || "Sans nom"}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  className={
                                    role === "admin"
                                      ? "bg-primary text-primary-foreground border border-primary"
                                      : ""
                                  }
                                  variant={
                                    role === "admin" ? "default" : "secondary"
                                  }
                                >
                                  {role === "admin" ? (
                                    <Shield className="h-3 w-3 mr-1 inline" aria-hidden="true" />
                                  ) : null}
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell className="text-right flex gap-2 justify-end">
                            {!isCurrentUser ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleAdminRole(user.user_id, user.roles)
                                  }
                                >
                                  {isAdmin ? (
                                    <>
                                      <ShieldOff className="h-4 w-4 mr-1" aria-hidden="true" />
                                      Retirer admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 mr-1" aria-hidden="true" />
                                      Rendre admin
                                    </>
                                  )}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                                      Supprimer
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Supprimer l'utilisateur ?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est{" "}
                                        <span className="font-bold text-red-600">
                                          irréversible
                                        </span>
                                        .<br />
                                        Voulez-vous vraiment supprimer cet
                                        utilisateur ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Annuler
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={async () => {
                                          const error = await deleteUser(
                                            user.user_id,
                                          );
                                          if (error) {
                                            toast({
                                              title: "Erreur",
                                              description: error,
                                              variant: "destructive",
                                            });
                                          } else {
                                            toast({
                                              title: "Utilisateur supprimé",
                                              description:
                                                "L'utilisateur a bien été supprimé.",
                                            });
                                            refetch();
                                          }
                                        }}
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                (Vous)
                              </span>
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

export default AdminUsers;
