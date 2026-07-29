import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(setSwReg).catch(() => {});
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) { console.warn('VITE_VAPID_PUBLIC_KEY not set'); return false; }
    const reg = swReg || (await navigator.serviceWorker.ready);
    if (!reg) return false;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as string,
    });
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co'}/functions/v1/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
          'x-subpath': '/push/subscribe',
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
        }),
      },
    );
    setSubscribed(true);
    return true;
  }, [swReg]);

  const unsubscribe = useCallback(async () => {
    const reg = swReg || (await navigator.serviceWorker.ready);
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co'}/functions/v1/notifications`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
            'x-subpath': '/push/subscribe',
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        },
      );
    }
    setSubscribed(false);
  }, [swReg]);

  return { permission, subscribed, requestPermission, subscribe, unsubscribe };
}
