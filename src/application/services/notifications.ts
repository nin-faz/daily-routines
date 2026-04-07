import { supabase } from "@/data/integrations/supabase/client";

/**
 * Convertit une clé VAPID base64 en Uint8Array pour l'API Push.
 */
const urlB64ToUint8Array = (base64String: string): BufferSource => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Enregistre le Service Worker et abonne l'utilisateur aux notifications push.
 * Sauvegarde la subscription en base via l'Edge Function `save-subscription`.
 */
export const registerServiceWorker = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("⚠️ Service Workers ou Push API non supportés");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    const existingSubscription = await registration.pushManager.getSubscription();

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return false;

    const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);

    let subscription = existingSubscription;
    if (!existingSubscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      if (!subscription) return false;
    }

    if (!subscription) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.functions.invoke("save-subscription", {
      body: { subscription: subscription.toJSON() },
    });

    if (error) {
      console.error("❌ ERREUR save-subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ ERREUR enregistrement Service Worker:", error);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

/**
 * Désinscrit l'utilisateur des notifications push sur cet appareil.
 * Supprime la subscription du navigateur ET de Supabase.
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const unsubscribed = await subscription.unsubscribe();
    if (!unsubscribed) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return true;

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", session.user.id)
      .eq("endpoint", subscription.endpoint);

    if (error) {
      console.error("Erreur lors de la suppression des subscriptions:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de la désinscription:", error);
    return false;
  }
};
