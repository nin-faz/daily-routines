import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Loader from "@/components/shared/Loader";

const Routines = lazy(() => import("./pages/routine/Routines"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Projects = lazy(() => import("./pages/Projects"));
const Stats = lazy(() => import("./pages/Stats"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/password/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/password/ResetPassword"));
const RoutineDetails = lazy(() => import("./pages/routine/RoutineDetails"));
const TimerView = lazy(() => import("./pages/TimerView"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Composant qui initialise le thème globalement
const ThemeInitializer = () => {
  useTheme();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>
        <ThemeInitializer />
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Suspense fallback={<Loader className="py-12" />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
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
                path="/routine/:routineId"
                element={
                  <ProtectedRoute>
                    <RoutineDetails />
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
                path="/admin/projects"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProjects />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
