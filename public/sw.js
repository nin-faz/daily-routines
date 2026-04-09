// Service Worker pour les notifications push

const CACHE_NAME = "daily-routines-v1";

/**
 * Convertir la clé publique base64 en Uint8Array
 * urlB64ToUint8Array est une fonction qui encode la clé publique base64 dans un tableau, nécessaire à l'option d'abonnement.
 */
const urlB64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Installation du Service Worker
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  // Forcer le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
});

/**
 * Activation du Service Worker
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  // Prendre le contrôle de tous les clients immédiatement
  event.waitUntil(self.clients.claim());
});

/**
 * Écouter les événements push
 */
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  if (!event.data) {
    console.log("Aucune donnée dans le push");
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (error) {
    console.log("Données reçues en texte brut");
    data = { title: "Mes Routines", body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: "/logo.svg",
    badge: "/logo.svg",
    vibrate: [200, 100, 200],
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: {
      url: "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Mes Routines", options),
  );
});

/**
 * Écouter les clics sur les notifications et renvoyer à la page
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click");
  event.notification.close();

  // Ouvrir/focus l'application
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Chercher si un client est déjà ouvert
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});
