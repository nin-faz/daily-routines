import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Role, UserContextType } from "@/shared/types/user";
import { getProfile } from "@/application/services/userProfileService";

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
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let shouldUpdate = true;

    const load = async () => {
      if (!user) {
        setRole(Role.User);
        setPseudo(null);
        setUserLoading(false);
        return;
      }

      const profile = await getProfile(user.id);

      if (shouldUpdate) {
        setRole((profile.role as Role) || Role.User);
        setPseudo(profile.pseudo ?? null);
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
    pseudo,
    loading: userLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
