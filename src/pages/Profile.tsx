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
import { requestNotificationPermission } from "@/lib/notifications";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [pseudo, setPseudo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkNotificationStatus();
    }
  }, [user]);

  const checkNotificationStatus = () => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  };

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
    } finally {
      setIsFetching(false);
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
        }
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
    if (notificationsEnabled) {
      toast({
        title: "Notifications",
        description:
          "Pour désactiver les notifications, utilisez les paramètres de votre navigateur.",
      });
    } else {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        toast({
          title: "Notifications activées",
          description: "Vous recevrez des rappels pour vos routines.",
        });
      } else {
        toast({
          title: "Notifications refusées",
          description:
            "Vous pouvez les activer dans les paramètres de votre navigateur.",
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
                  disabled={isFetching}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading || isFetching}
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
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {notificationsEnabled
                      ? "Notifications activées"
                      : "Notifications désactivées"}
                  </span>
                </div>
                <Switch
                  checked={notificationsEnabled}
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
