import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/shared/Loader";
import FloatingHelp from "@/components/shared/FloatingHelp";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    window.location.href = "/auth";
    return <Loader />; // Affiche un loader pendant le redirectionnement
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {children}
      {!requireAdmin && <FloatingHelp />}
    </>
  );
};

export default ProtectedRoute;
