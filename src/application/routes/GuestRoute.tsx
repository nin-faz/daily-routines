import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import Loader from "@/shared/components/Loader";

interface GuestRouteProps {
  children: ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return;
    <Loader />;
  }

  // Si l'utilisateur est déjà connecté, on le renvoie vers l'accueil
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
