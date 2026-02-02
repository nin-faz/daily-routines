import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      // 1. On attend un tout petit peu que Supabase traite le lien dans l'URL
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 2. On regarde si l'URL contient une erreur d'expiration (OTP_EXPIRED)
      const hash = window.location.hash;
      if (
        hash.includes("error_code=otp_expired") ||
        hash.includes("error=access_denied")
      ) {
        toast({
          title: "Lien expiré",
          description:
            "Ce lien de récupération n'est plus valide. Veuillez en demander un nouveau.",
          variant: "destructive",
        });
        navigate("/forgot-password");
        return;
      }

      // 3. Si pas de session et pas d'erreur, on redirige car l'accès est interdit
      if (!session) {
        toast({
          title: "Accès refusé",
          description:
            "Session introuvable. Veuillez utiliser le lien reçu par email.",
          variant: "destructive",
        });
        navigate("/forgot-password");
      }
    };

    checkSession();
  }, [navigate, toast]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("Début de la mise à jour du mot de passe...");

      // 1. On s'assure d'avoir la session la plus récente
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session perdue. Veuillez recommencer.");

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log("Réponse reçue:", error ? "Erreur" : "Succès");

      if (error) {
        throw error;
      }

      // Déconnexion pour forcer l'utilisateur à se reconnecter avec le nouveau mot de passe
      await supabase.auth.signOut();

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
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
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
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
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
