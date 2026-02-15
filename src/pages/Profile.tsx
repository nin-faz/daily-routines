import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/layout/Navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Save, Loader2, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  registerServiceWorker,
  unsubscribeFromPushNotifications,
} from "@/lib/notifications";
import { useNotifications } from "@/context/NotificationContext";

const Profile = () => {
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

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("pseudo")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setPseudo(data.pseudo || "");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || "",
          pseudo: pseudo,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (error) throw error;

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
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <ThemeSelector />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mon Profil
            </h1>
          </div>
        </header>

        <main className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
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
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
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
