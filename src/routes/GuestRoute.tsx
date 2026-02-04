import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/shared/Loader";

interface GuestRouteProps {
  children: ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  // Si l'utilisateur est déjà connecté, on le renvoie vers l'accueil
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
