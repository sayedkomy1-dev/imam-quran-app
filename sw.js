// Self-clearing Service Worker to purge stale caches and ensure fresh UI updates
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    ).then(() => self.registration.unregister())
     .then(() => self.clients.matchAll({ type: 'window' }))
     .then((clients) => {
       clients.forEach((client) => {
         if ('navigate' in client) {
           client.navigate(client.url);
         }
       });
     })
  );
});
