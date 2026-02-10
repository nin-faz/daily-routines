import { createContext, useContext, useEffect, useState } from "react";

type NotificationContextType = {
  isSubscribed: boolean;
  refreshStatus: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkStatus = async () => {
    if (!("serviceWorker" in navigator)) {
      setIsSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      // Le switch est activé seulement si :
      // 1. Il y a une subscription active
      // 2. ET la permission est accordée
      if (subscription && Notification.permission === "granted") {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du statut des notifications:",
        error,
      );
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // 1. Re-vérifier quand l'utilisateur revient sur l'app (détecte les changements de réglages)
    window.addEventListener("focus", checkStatus);

    // 2. Utiliser l'API Permissions pour détecter les changements de permission (si supportée)
    let permissionStatus: PermissionStatus | null = null;

    const setupPermissionListener = async () => {
      try {
        // Tentative d'utiliser l'API Permissions (pas supportée partout)
        if ("permissions" in navigator) {
          permissionStatus = await navigator.permissions.query({
            name: "notifications" as PermissionName,
          });

          // Écouter les changements de permission
          permissionStatus.onchange = () => {
            console.log(
              "Permission notification changée:",
              permissionStatus?.state,
            );
            checkStatus();
          };
        }
      } catch (error) {
        // L'API Permissions n'est pas supportée sur ce navigateur
        // Ce n'est pas grave, on se fie au focus et à l'interval de secours
        console.log("Permissions API non supportée, utilisation du fallback");
      }
    };

    setupPermissionListener();

    // 3. Vérification de secours toutes les 2 minutes (uniquement si l'API Permissions n'est pas disponible)
    const fallbackInterval = setInterval(checkStatus, 120000); // 2 minutes

    return () => {
      window.removeEventListener("focus", checkStatus);

      if (permissionStatus) {
        permissionStatus.onchange = null;
      }

      clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        isSubscribed,
        refreshStatus: checkStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
};
