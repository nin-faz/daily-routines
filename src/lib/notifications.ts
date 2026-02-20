import { supabase } from '@/integrations/supabase/client';

/**
 * Ce fichier gère tout le système de notifications push : inscription, désinscription, et permissions.
 * Il fait le lien entre le navigateur (Service Worker) et Supabase (backend).
 */

/**
 * Convertir une clé VAPID base64 en Uint8Array pour l'API Push
 */
const urlB64ToUint8Array = (base64String: string): BufferSource => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Enregistrer le Service Worker et s'abonner aux notifications push
 * À appeler au démarrage de l'application
 */
export const registerServiceWorker = async (): Promise<boolean> => {
  // Vérifier si le navigateur supporte Service Workers et Push notifications
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Service Workers ou Push API non supportés');
    return false;
  }

  try {
    // 1. Récupérer le Service Worker (déjà enregistré dans main.tsx)
    const registration = await navigator.serviceWorker.ready;

    // 2. Demander la permission de notifications
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('⚠️ Permission notifications refusées - subscription non créée');
      return false;
    }

    // 3. Vérifier si une subscription existe déjà
    const existingSubscription = await registration.pushManager.getSubscription();

    // Récupérer la clé VAPID
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return false;
    }

      const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);

    // 4. S'abonner aux notifications push (ou réutiliser l'existante)
    let subscription = existingSubscription;

    if (!existingSubscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      if (!subscription) {
        console.error('❌ ERREUR: Impossible de créer la subscription');
        return false;
      }
      console.log('✅ Subscription créée:', subscription.endpoint.substring(0, 50) + '...');
    }

    if (!subscription) {
      console.error('Impossible de créer la subscription');
      return false;
    }

    // 5. IMPORTANT: Toujours envoyer la subscription à Supabase (nouveau ou existant)
    // pour s'assurer qu'elle est en base de données
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('⚠️ Utilisateur non connecté - subscription créée mais non sauvegardée');
      return false;
    }

    /**
     * Laisser le Supabase client JS envoyer automatiquement le JWT
     * (pas besoin de passer les headers manuellement)
     */
    const { error } = await supabase.functions.invoke('save-subscription', {
      body: {
        subscription: subscription.toJSON()
      },
    });

    if (error) {
      console.error('❌ ERREUR save-subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ ERREUR enregistrement Service Worker:', error);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  /** Affiche la pop up souhaitant autoriser ou non, ces notifications */
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Désactiver toutes les notifications push pour cet utilisateur sur cet appareil
 * Supprime la subscription du navigateur ET de la base de données
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    // 1. Récupérer le Service Worker registration
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    // 2. Récupérer la subscription existante
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true; // Pas d'erreur, juste rien à faire
    }

    // 3. Unsubscribe du navigateur
    const unsubscribed = await subscription.unsubscribe();
    if (!unsubscribed) {
      console.error('Échec de la désinscription du navigateur');
      return false;
    }

    // 4. Supprimer de la base de données Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return true;
    }

    // Supprimer toutes les subscriptions de cet utilisateur
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', session.user.id)
      .eq('endpoint', subscription.endpoint)

    if (error) {
      console.error('Erreur lors de la suppression des subscriptions de la DB:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la désinscription:', error);
    return false;
  }
};
