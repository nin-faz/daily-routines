import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/data/integrations/supabase/client";
import { upsertProfile } from "@/application/services/userProfileService";
import { deleteSubscriptionFromDB, registerServiceWorker } from "@/application/services/notifications";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ data: any; error: Error | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * onAuthStateChange se déclenche immédiatement au montage
     * et gère tous les changements d'état sans auto-créer de session depuis l'URL
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const storedUserId = localStorage.getItem("user-id");
        if (storedUserId && storedUserId !== session.user.id) {
          // Nouvel user différent — purge les données de l'ancien
          const keepKeys = ["theme", "intro_completed"];
          const toKeep: Record<string, string> = {};
          keepKeys.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value !== null) toKeep[key] = value;
          });
          localStorage.clear();
          Object.entries(toKeep).forEach(([k, v]) =>
            localStorage.setItem(k, v),
          );
        }
        localStorage.setItem("user-id", session.user.id);

        // Re-enregistrer la subscription push si le browser l'a encore active
        if ("serviceWorker" in navigator && "PushManager" in window && Notification.permission === "granted") {
          navigator.serviceWorker.getRegistration().then((reg) =>
            reg?.pushManager.getSubscription().then((sub) => {
              if (sub) registerServiceWorker();
            })
          );
        }
      }
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("user-id");
      }
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user && displayName) {
      await upsertProfile(data.user.id, { email, pseudo: displayName }).catch(() => {});
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await deleteSubscriptionFromDB();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      const keepKeys = ["theme", "intro_completed"];
      const toKeep: Record<string, string> = {};

      // Sauvegarder les clés à garder
      keepKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          toKeep[key] = value;
        }
      });

      // Tout effacer
      localStorage.clear();

      // Restaurer les clés à garder
      Object.entries(toKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }

    if (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
