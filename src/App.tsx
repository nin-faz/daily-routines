import { Suspense, lazy, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/application/context/AuthContext";
import { UserProvider, useUser } from "@/application/context/UserContext";
import { ThemeProvider as CustomThemeProvider } from "@/application/context/ThemeContext";
import { useTheme } from "@/application/context/ThemeContext";
import ProtectedRoute from "@/application/routes/ProtectedRoute";
import GuestRoute from "@/application/routes/GuestRoute";
import SplashScreen from "@/shared/components/SplashScreen";
import {
  NotificationProvider,
  useNotifications,
} from "@/application/context/NotificationContext";
import { registerServiceWorker } from "@/application/services/notifications";

const Home = lazy(() => import("@/views/pages/Home"));
const Dashboard = lazy(() => import("@/views/pages/Dashboard"));
const Routines = lazy(() => import("@/views/pages/routine/Routines"));
const Calendar = lazy(() => import("@/views/pages/Calendar"));
const Tasks = lazy(() => import("@/views/pages/Tasks"));
const RoutineDetails = lazy(
  () => import("@/views/pages/routine/RoutineDetails"),
);
const ArchivedRoutines = lazy(
  () => import("@/views/pages/routine/RoutineArchived"),
);
const AllRoutines = lazy(() => import("@/views/pages/routine/AllRoutines"));
const TimerView = lazy(() => import("@/views/pages/routine/TimerView"));
const FolderDetails = lazy(() => import("@/views/pages/FolderDetails"));
const Stats = lazy(() => import("@/views/pages/Stats"));
const Auth = lazy(() => import("@/views/pages/Auth"));
const ForgotPassword = lazy(
  () => import("@/views/pages/password/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("@/views/pages/password/ResetPassword"),
);
const Profile = lazy(() => import("@/views/pages/Profile"));
const AdminDashboard = lazy(() => import("@/views/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/views/pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("@/views/pages/admin/AdminFolders"));
const AdminTasks = lazy(() => import("@/views/pages/admin/AdminTasks"));
const Actus = lazy(() => import("@/views/pages/Actus"));
const NotFound = lazy(() => import("@/views/pages/NotFound"));

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

    const handlePermissionChange = async () => {
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

    const setupPermissionListener = async () => {
      try {
        if ("permissions" in navigator && user && !user.loading) {
          permissionStatus = await navigator.permissions.query({
            name: "notifications" as PermissionName,
          });

          // Détecter quand la permission change (ex: de "default" à "granted")
          permissionStatus.addEventListener("change", handlePermissionChange);
        }
      } catch (error) {
        console.log("Permissions API non supportée");
      }
    };

    setupPermissionListener();

    return () => {
      window.removeEventListener("focus", initNotifications);

      if (permissionStatus) {
        permissionStatus.removeEventListener("change", handlePermissionChange);
      }
    };
  }, [user, refreshStatus]);

  // Splash uniquement si l'user était déjà connecté (clé user-id en localStorage) convertit en boolean
  const wasLoggedIn = !!localStorage.getItem("user-id");

  // Évite d'afficher le robot sur les pages publiques pour les visiteurs non connectés

  const isLoading = !user || !theme || user.loading || theme.loading;
  const [splashVisible, setSplashVisible] = useState(wasLoggedIn && isLoading);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLoading && minTimeDone) setSplashVisible(false);
  }, [isLoading, minTimeDone]);

  return (
    <>
      <SplashScreen visible={splashVisible} />
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {/* Splash couvre déjà les phases de chargement — pas besoin d'un fallback visible */}
        <Suspense fallback={null}>
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
            <Route path="/" element={<Home />} />
            <Route path="/actus" element={<Actus />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines"
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
  <HelmetProvider>
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
  </HelmetProvider>
);

export default App;
