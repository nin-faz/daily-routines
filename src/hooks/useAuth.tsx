/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ThemePalette } from "@/hooks/useTheme";

type AppRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  colorTheme: ThemePalette;
  updateColorTheme: (color: ThemePalette) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [colorTheme, setColorTheme] = useState<ThemePalette>(() => {
    const saved = localStorage.getItem("theme-palette");
    return (saved as ThemePalette) || "orange";
  });

  const fetchUserProfile = async (
    userId: string,
  ): Promise<{ roles: AppRole[]; colorTheme: ThemePalette }> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, color_theme")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return { roles: ["user"], colorTheme: "orange" };
      }

      if (!data) return { roles: ["user"], colorTheme: "orange" };

      // Validate and return role
      const role =
        data.role === "admin" || data.role === "user" ? data.role : "user";

      // Validate and return color_theme
      const validColors: ThemePalette[] = [
        "orange",
        "blue",
        "green",
        "purple",
        "pink",
        "cyan",
      ];
      const color = validColors.includes(data.color_theme as ThemePalette)
        ? (data.color_theme as ThemePalette)
        : "orange";

      return { roles: [role], colorTheme: color };
    } catch (error) {
      console.error("❌ Exception in fetchUserProfile:", error);
      return { roles: ["user"], colorTheme: "orange" };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("🔄 Auth Event:", event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          if (mounted) {
            const { roles, colorTheme } = await fetchUserProfile(
              session.user.id,
            );
            setRoles(roles);
            setColorTheme(colorTheme);
            localStorage.setItem("theme-palette", colorTheme);
          }
        }, 0);
      } else {
        setRoles([]);
        setColorTheme("orange");
        localStorage.setItem("theme-palette", "orange");
      }

      setLoading(false);
    });

    // Check for existing session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      console.log(
        "✅ Session récupérée:",
        session ? "Connecté" : "Non connecté",
      );

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { roles, colorTheme } = await fetchUserProfile(session.user.id);
        if (mounted) {
          setRoles(roles);
          setColorTheme(colorTheme);
          localStorage.setItem("theme-palette", colorTheme);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const updateColorTheme = async (color: ThemePalette) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ color_theme: color })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Erreur lors de la mise à jour du thème:", error);
        throw error;
      }

      setColorTheme(color);
      localStorage.setItem("theme-palette", color);
    } catch (error) {
      console.error("❌ Exception updateColorTheme:", error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("1. Déconnexion en cours...");
    // On ajoute un timeout manuel pour ne pas rester bloqué indéfiniment
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        isAdmin,
        colorTheme,
        updateColorTheme,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
