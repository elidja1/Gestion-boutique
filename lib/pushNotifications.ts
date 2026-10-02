// Web Push Notification & Desktop Audio Alert Helper for PWA and PC
import { playBeepSound } from './utils';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5NmbH8U';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function getNotificationPermissionState(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission;
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      granted: false,
      permission: 'denied',
      message: 'Les notifications ne sont pas prises en charge par ce navigateur.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play confirmation chime
      playBeepSound('chime');
      // Show confirmation desktop notification
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('🔔 Notifications PC Activées !', {
            body: 'Vous recevrez désormais des alertes sonores et des notifications lors de chaque vente.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        } else {
          new Notification('🔔 Notifications PC Activées !', {
            body: 'Vous recevrez désormais des alertes sonores et des notifications lors de chaque vente.',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.warn('Confirmation notification error', e);
      }

      return {
        granted: true,
        permission: 'granted',
        message: 'Notifications PC et alertes sonores activées avec succès !',
      };
    } else {
      return {
        granted: false,
        permission,
        message: 'Permission de notification refusée. Veuillez autoriser les notifications dans les paramètres du navigateur.',
      };
    }
  } catch (err: any) {
    return {
      granted: false,
      permission: 'denied',
      message: err?.message || 'Erreur lors de la demande de permission.',
    };
  }
}

export async function registerPushNotification(userId?: string, userName?: string): Promise<{ success: boolean; message: string }> {
  if (!(await isPushNotificationSupported())) {
    return { success: false, message: 'Les notifications Push ne sont pas supportées sur ce navigateur.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Permission refusée pour les notifications.' };
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            userId,
            userName,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (swErr) {
        console.warn('Service worker push registration warning:', swErr);
      }
    }

    return { success: true, message: 'Notifications activées dans le navigateur !' };
  } catch (error: any) {
    console.error('Push registration error:', error);
    return { success: false, message: error?.message || "Erreur lors de l'activation des notifications." };
  }
}

/**
 * Triggers a rich desktop notification pop-up and an audible audio chime on the PC.
 */
export async function triggerDesktopPushAndSound(options: {
  title: string;
  body: string;
  url?: string;
  soundType?: 'cash' | 'chime' | 'success' | 'error';
}): Promise<void> {
  const { title, body, url = '/', soundType = 'chime' } = options;

  // 1. Play audible sound immediately on PC
  playBeepSound(soundType);

  // 2. Dispatch native desktop notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `vgm-notif-${Date.now()}`,
            data: { url },
            vibrate: [200, 100, 200],
          } as NotificationOptions);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.warn('Service worker notification fallback to window.Notification:', err);
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {}
      }
    }
  }

  // 3. Broadcast to server push endpoint asynchronously
  try {
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url }),
    }).catch(() => {});
  } catch {}
}

export async function sendTestPushNotification(title: string, body: string, url: string = '/'): Promise<{ success: boolean; message: string }> {
  try {
    await triggerDesktopPushAndSound({
      title,
      body,
      url,
      soundType: 'cash',
    });
    return { success: true, message: 'Notification et alerte sonore envoyées avec succès !' };
  } catch (err: any) {
    return { success: false, message: err?.message || "Échec de l'envoi de la notification." };
  }
}
