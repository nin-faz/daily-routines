import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdminQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, CheckSquare, Shield } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const { data: stats, isLoading: loading } = useAdminStats();

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      link: "/admin/users",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Projets",
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      link: "/admin/projects",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Tâches",
      value: stats?.totalTasks ?? 0,
      icon: CheckSquare,
      link: "/admin/projects",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Admins",
      value: stats?.adminCount ?? 0,
      icon: Shield,
      link: "/admin/users",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'application
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
