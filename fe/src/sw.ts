/// <reference lib="webworker" />

const sw = self as ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(sw.__WB_MANIFEST);

sw.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'AppGuru', body: '', icon: '/icon.svg' };
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
    requireInteraction: true,
  };
  event.waitUntil(sw.registration.showNotification(data.title, options));
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) { existing.focus(); return; }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
