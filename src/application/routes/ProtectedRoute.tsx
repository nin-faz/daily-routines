import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { useUser } from "@/application/context/UserContext";
import Loader from "@/shared/components/Loader";
// import FeedbackChat from "@/shared/components/FeedbackChat";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const userContext = useUser();
  const isAdmin = userContext?.isAdmin ?? false;

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    window.location.href = "/";
    return <Loader />;
  }
  // Si un malin essaye d'accéder via l'url à une page admin alors qu'il n'est pas admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {children}
      {/* {!requireAdmin && <FeedbackChat />} */}
    </>
  );
};

export default ProtectedRoute;
