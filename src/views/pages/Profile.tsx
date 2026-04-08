import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/application/context/AuthContext";
import { getProfile, upsertProfile } from "@/application/services/userProfileService";
import Navigation from "@/application/components/layout/Navigation";
import { ThemeToggle } from "@/views/components/theme/ThemeToggle";
import { ThemeSelector } from "@/views/components/theme/ThemeSelector";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ArrowLeft, User, Save, Loader2, Bell, BellOff } from "lucide-react";
import { useToast } from "@/application/hooks/use-toast";
import { Switch } from "@/shared/components/ui/switch";
import {
  registerServiceWorker,
  unsubscribeFromPushNotifications,
} from "@/application/services/notifications";
import { useNotifications } from "@/application/context/NotificationContext";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const Profile = () => {
  usePageTitle("Mon Profil");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, refreshStatus } = useNotifications();
  const { toast } = useToast();

  const [pseudo, setPseudo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // État local optimiste pour le switch (change instantanément)
  const [localIsSubscribed, setLocalIsSubscribed] = useState(isSubscribed);

  // Synchroniser l'état local avec le context
  useEffect(() => {
    setLocalIsSubscribed(isSubscribed);
  }, [isSubscribed]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const profile = await getProfile(user.id);
    setPseudo(profile.pseudo || "");
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await upsertProfile(user.id, { email: user.email || "", pseudo });
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    // Update optimiste : changement instantané de l'UI
    const newState = !localIsSubscribed;
    setLocalIsSubscribed(newState);

    // Si les notifications sont déjà activées, on désactive
    if (isSubscribed) {
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        await refreshStatus();

        toast({
          title: "Notifications désactivées",
          description: "Cet appareil ne recevra plus de rappels.",
        });
      } else {
        // Revert en cas d'erreur
        setLocalIsSubscribed(isSubscribed);
        toast({
          title: "Erreur",
          description: "Impossible de désactiver les notifications.",
          variant: "destructive",
        });
      }
      return;
    }

    // Sinon, on active les notifications
    const success = await registerServiceWorker();

    if (success) {
      // Attendre un court délai pour que le navigateur mette à jour son état
      await new Promise((resolve) => setTimeout(resolve, 300));
      await refreshStatus();

      toast({
        title: "Notifications activées !",
        description: "Cet appareil est prêt à recevoir vos rappels.",
      });
    } else {
      // Revert en cas d'erreur
      setLocalIsSubscribed(isSubscribed);

      if (Notification.permission === "denied") {
        toast({
          title: "Accès refusé",
          description:
            "Veuillez autoriser les notifications dans les réglages de votre navigateur.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'activer les notifications.",
          variant: "destructive",
        });
      }
    }
  };

  const getInitials = () => {
    if (pseudo) {
      return pseudo
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-bg pb-20 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Retour">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <ThemeSelector />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mon Profil
            </h1>
          </div>
        </header>

        <main className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20" aria-label={`Avatar de ${pseudo || user?.email}`}>
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground" aria-hidden="true">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{pseudo || user?.email}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pseudo">Nom d'affichage</Label>
                <Input
                  id="pseudo"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Recevez des rappels pour vos routines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {localIsSubscribed ? (
                    <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="text-sm">
                    {localIsSubscribed
                      ? "Notifications activées"
                      : "Notifications désactivées"}
                  </span>
                </div>
                <Switch
                  checked={localIsSubscribed}
                  onCheckedChange={handleNotificationToggle}
                  aria-label={localIsSubscribed ? "Désactiver les notifications" : "Activer les notifications"}
                />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;
