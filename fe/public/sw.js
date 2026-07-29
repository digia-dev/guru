importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'AppGuru', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body ?? '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url ?? '/' },
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) { existing.focus(); return; }
      return clients.openWindow(url);
    }),
  );
});
