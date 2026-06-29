import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/application/context/AuthContext";
import { useUser } from "@/application/context/UserContext";
import Loader from "@/shared/components/Loader";
import AppBackground from "@/shared/components/AppBackground";
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
    return <Navigate to="/" replace />;
  }
  // Si un malin essaye d'accéder via l'url à une page admin alors qu'il n'est pas admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AppBackground />
      <div className="protected-layout">
        {children}
      </div>
      {/* {!requireAdmin && <FeedbackChat />} */}
    </>
  );
};

export default ProtectedRoute;
