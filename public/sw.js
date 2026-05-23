const CACHE_NAME = 'shahid-sons-cashbook-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/icon.svg',
  '/manifest.json'
];

// Install Service Worker and cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[Service Worker] Asset pre-caching failed (can be ignored in dev):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate and remove stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept requests and fallback to cache if offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests or same-origin requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass key-value, backup, or dev server specific HMR/websocket requests
  if (url.pathname.includes('socket.io') || url.pathname.includes('hmr') || url.hostname.includes('localhost') && event.request.url.includes('ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, and update in background (Network-First Fallback)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* mute */ });
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Cache newly fetched assets
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // Safe offline response of SPA if network fails
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return Promise.reject(err);
      });
    })
  );
});
