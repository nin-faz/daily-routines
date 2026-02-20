import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import Loader from "@/components/shared/Loader";
import FeedbackChat from "@/components/shared/FeedbackChat";

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
    window.location.href = "/auth";
    return <Loader />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {children}
      {!requireAdmin && <FeedbackChat />}
    </>
  );
};

export default ProtectedRoute;
