import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useToast } from "@/application/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import Loader from "@/shared/components/Loader";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import { emailSchema, passwordSchema } from "@/shared/lib/validationSchemas";

const Auth = () => {
  usePageTitle("Connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description:
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, displayName || undefined);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "Cet email est déjà utilisé";
      }
      toast({
        title: "Erreur d'inscription",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Bienvenue ! Vous êtes maintenant connecté.",
      });
      // La redirection se fait automatiquement via le useEffect
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{`
        @keyframes glow-pulse { 0%,100%{opacity:.12} 50%{opacity:.22} }
        .auth-glow { animation: glow-pulse 5s ease-in-out infinite; }
        .auth-title-gradient {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, #fde68a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background"
    >
      {/* Blobs orange — même vibe que Home, intensité réduite pour ne pas écraser le fond clair */}
      <div
        className="auth-glow pointer-events-none absolute"
        style={{
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
          top: "-150px", right: "-100px",
        }}
        aria-hidden="true"
      />
      <div
        className="auth-glow pointer-events-none absolute"
        style={{
          width: "400px", height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          bottom: "-100px", left: "-80px",
          animationDelay: "2.5s",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-4">
        <a
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm w-fit"
          style={{ textDecoration: "none" }}
        >
          ← Retour à l'accueil
        </a>

      <Card className="w-full shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-10"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="auth-title-gradient text-2xl font-bold">
            Daily Routines
          </CardTitle>
          <CardDescription>
            Gérez vos routines quotidiennes
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-auto max-w-xs">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    aria-required="true"
                    aria-describedby={
                      errors.email ? "signin-email-error" : undefined
                    }
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p
                      id="signin-email-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié&nbsp;?
                    </Link>
                  </div>
                  <PasswordInput
                    id="signin-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    aria-required="true"
                    aria-describedby={
                      errors.password ? "signin-password-error" : undefined
                    }
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p
                      id="signin-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" aria-hidden="true" />
                  )}
                  Se connecter
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    Nom d'affichage (optionnel)
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    aria-required="true"
                    aria-describedby={
                      errors.email ? "signup-email-error" : undefined
                    }
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p
                      id="signup-email-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-describedby={
                      errors.password ? "signup-password-error" : undefined
                    }
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p
                      id="signup-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" aria-hidden="true" />
                  )}
                  S'inscrire
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      </div>
    </main>
    </>
  );
};

export default Auth;
