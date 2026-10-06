// Development service worker — Network first to avoid stale React code
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Fetch directly from network
self.addEventListener('fetch', (e) => {
  // Let the browser handle fetches directly in development
  return;
});
