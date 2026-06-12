import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("Page introuvable");
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page non existante
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour à l'accueil
        </a>
      </div>
    </main>
    </>
  );
};

export default NotFound;
