// Service Worker for Vertu De Gloire Market PWA
const CACHE_NAME = 'vgm-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Safe add: ignore individual asset failures
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy: always fetch fresh from network, fall back to cache when offline
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignore non-http/https requests (e.g. chrome-extension, ws)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;
  if (event.request.method !== 'GET') return;

  // For Next.js HMR and webpack/turbopack dev chunks, let them pass through
  if (url.includes('/_next/webpack-hmr') || url.includes('turbopack')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache if network is unavailable
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If navigating to a page offline, return cached root
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Hors-ligne - Données locales indisponibles', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
        });
      })
  );
});
