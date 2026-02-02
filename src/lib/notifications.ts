export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleRoutineNotification = (routineName: string, time: string) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  // Si l'heure est passée aujourd'hui, programmer pour demain
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    new Notification('Mes Routines', {
      body: `C'est l'heure de : ${routineName}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: routineName,
      requireInteraction: false,
    });
  }, timeUntilNotification);
};

export const sendImmediateNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
    });
  }
};
