/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute((self as any).__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'AppGuru', body: '', icon: '/icon.svg' };
  const options: NotificationOptions & { vibrate?: number[]; actions?: any[] } = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) { (existing as WindowClient).focus(); return; }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
