import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email invalide");

const ForgotPassword = () => {
  usePageTitle("Mot de passe oublié");
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const { error } = await resetPassword(email);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsEmailSent(true);
      toast({
        title: "Email envoyé",
        description:
          "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.",
      });
    }
  };

  if (isEmailSent) {
    return (
      <main className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Email envoyé !
            </CardTitle>
            <CardDescription className="text-base">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous
              recevrez un email avec les instructions pour réinitialiser votre
              mot de passe.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={() => setIsEmailSent(false)}
            >
              <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
              Renvoyer l'email
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Retour à la connexion
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
            <Mail className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-base">
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                aria-required="true"
                aria-describedby={error ? "email-error" : undefined}
                aria-invalid={!!error}
              />
              {error && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                  Envoyer le lien
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Retour à la connexion
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
};

export default ForgotPassword;
