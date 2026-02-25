import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import { useTheme } from "@/context/ThemeContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import GuestRoute from "@/routes/GuestRoute";
import Loader from "@/components/shared/Loader";
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext";
import { registerServiceWorker } from "./lib/notifications";

const Routines = lazy(() => import("./pages/routine/Routines"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Tasks = lazy(() => import("./pages/Tasks"));
const RoutineDetails = lazy(() => import("./pages/routine/RoutineDetails"));
const ArchivedRoutines = lazy(() => import("./pages/routine/RoutineArchived"));
const AllRoutines = lazy(() => import("./pages/routine/AllRoutines"));
const TimerView = lazy(() => import("./pages/routine/TimerView"));
const FolderDetails = lazy(() => import("./pages/FolderDetails"));
const Stats = lazy(() => import("./pages/Stats"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/password/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/password/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminFolders"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Composant qui initialise le thème globalement
const ThemeInitializer = () => {
  useTheme();
  return null;
};

// Composant wrapper pour gérer le chargement du thème
const AppContent = () => {
  const user = useUser();
  const theme = useTheme();
  const { refreshStatus } = useNotifications();

  useEffect(() => {
    const initNotifications = async () => {
      if (user && !user.loading) {
        // Si la permission est déjà donnée, synchroniser la subscription avec la DB
        if (Notification.permission === "granted") {
          // registerServiceWorker() va :
          // 1. Récupérer ou créer la subscription locale
          // 2. Toujours l'envoyer à la DB pour s'assurer qu'elle y est
          await registerServiceWorker();

          // Rafraîchir le statut après synchronisation
          refreshStatus();
        }
      }
    };

    // Vérifier au chargement de l'utilisateur
    initNotifications();

    // Re-vérifier quand l'app reçoit le focus
    // (pour détecter si l'utilisateur a activé les notifs dans les réglages)
    window.addEventListener("focus", initNotifications);

    // Écouter les changements de permission en temps réel
    let permissionStatus: PermissionStatus | null = null;

    const setupPermissionListener = async () => {
      try {
        if ("permissions" in navigator && user && !user.loading) {
          permissionStatus = await navigator.permissions.query({
            name: "notifications" as PermissionName,
          });

          // Détecter quand la permission change (ex: de "default" à "granted")
          permissionStatus.onchange = async () => {
            console.log(
              "🔔 Permission notification changée:",
              permissionStatus?.state,
            );

            // Si l'utilisateur vient d'accepter les notifications
            if (permissionStatus?.state === "granted") {
              console.log("✅ Création automatique de la subscription...");
              await registerServiceWorker();
              refreshStatus();
            } else {
              // Si refusé ou révoqué, juste rafraîchir le statut
              refreshStatus();
            }
          };
        }
      } catch (error) {
        console.log("Permissions API non supportée");
      }
    };

    setupPermissionListener();

    return () => {
      window.removeEventListener("focus", initNotifications);

      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [user]);

  if (!user || !theme || user.loading || theme.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Suspense fallback={<Loader className="py-12" />}>
          <Routes>
            <Route
              path="/auth"
              element={
                <GuestRoute>
                  <Auth />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Routines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routine/:routineId"
              element={
                <ProtectedRoute>
                  <RoutineDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines/archive"
              element={
                <ProtectedRoute>
                  <ArchivedRoutines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines/all"
              element={
                <ProtectedRoute>
                  <AllRoutines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timer/:routineId"
              element={
                <ProtectedRoute>
                  <TimerView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/folder/:id"
              element={
                <ProtectedRoute>
                  <FolderDetails />
                </ProtectedRoute>
              }
            />
            ;
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/folders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminTasks />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" enableSystem={false}>
      <NotificationProvider>
        <AuthProvider>
          <UserProvider>
            <CustomThemeProvider>
              <ThemeInitializer />
              <AppContent />
            </CustomThemeProvider>
          </UserProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
