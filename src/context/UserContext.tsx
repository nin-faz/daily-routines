import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { Role, UserContextType } from "@/types/user";

const UserContext = createContext<UserContextType | null>(null);

/**
 * Hook pour accéder aux données utilisateur comme roles, isAdmin et loading
 */
export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(Role.User);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let shouldUpdate = true;

    const load = async () => {
      if (!user) {
        setRole(Role.User);
        setUserLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (shouldUpdate) {
        setRole((data?.role as Role) || Role.User);
        setUserLoading(false);
      }
    };

    load();

    return () => {
      shouldUpdate = false;
    };
  }, [user]);

  const value: UserContextType = {
    role,
    isAdmin: role === Role.Admin,
    loading: userLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
