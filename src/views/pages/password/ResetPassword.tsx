import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/data/integrations/supabase/client";
import { passwordSchema } from "@/shared/lib/validationSchemas";
import { Button } from "@/shared/components/ui/button";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useToast } from "@/application/hooks/use-toast";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const ResetPassword = () => {
  usePageTitle("Réinitialiser le mot de passe");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extraire les tokens du HASH de l'URL (#access_token=...&refresh_token=...)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    const refresh = hashParams.get("refresh_token");

    if (token && refresh) {
      setAccessToken(token);
      setRefreshToken(refresh);
    } else {
      toast({
        title: "Accès refusé",
        description:
          "Lien de récupération invalide. Veuillez utiliser le lien reçu par email.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [navigate, toast]);

  // Soumission: mise à jour du mot de passe via Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      toast({
        title: "Erreur",
        description:
          "Token manquant. Veuillez utiliser le lien reçu par email.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    // Validation avec Zod
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "Erreur",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!refreshToken) {
        toast({
          title: "Erreur",
          description: "Session expirée. Token manquant.",
          variant: "destructive",
        });
        navigate("/forgot-password");
        return;
      }

      console.log("🔐 Création session temporaire...");
      // Créer une session temporaire UNIQUEMENT pour updateUser
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error("❌ Erreur setSession:", sessionError);
        toast({
          title: "Lien expiré",
          description: "Ce lien de récupération n'est plus valide.",
          variant: "destructive",
        });
        navigate("/forgot-password");
        return;
      }

      console.log("✅ Session temporaire créée");
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log("🚪 Déconnexion immédiate...");
      // Déconnecter IMMÉDIATEMENT pour ne pas laisser l'utilisateur connecté
      await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Succès",
          description: "Votre mot de passe a été mis à jour avec succès.",
        });

        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mot de passe réinitialisé !
            </CardTitle>
            <CardDescription className="text-base">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez
              maintenant vous connecter.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={() => navigate("/auth")}
            >
              Se connecter
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nouveau mot de passe
          </CardTitle>
          <CardDescription className="text-base">
            Choisissez un nouveau mot de passe pour votre compte
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin mr-2"
                    aria-hidden="true"
                  />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                  Réinitialiser le mot de passe
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
};

export default ResetPassword;
