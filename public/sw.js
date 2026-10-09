const CACHE_NAME = 'scanner-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through fetch is enough to pass the PWA install criteria
  event.respondWith(fetch(event.request));
});
