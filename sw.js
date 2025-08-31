// Simple app-shell cache for offline use
const CACHE_NAME = 'adeera-dada-v1';
const CORE_ASSETS = [
  './',            // index.html
  './index.html',  // explicit
  './manifest.webmanifest'
  // If you add icon files, list them too:
  // './icon-192.png',
  // './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // App shell strategy: try network first, fall back to cache
  event.respondWith(
    fetch(req).then(res => {
      // cache a copy of GET requests
      if (req.method === 'GET' && res && res.status === 200) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
      }
      return res;
    }).catch(async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      // last resort: return cached index for navigations
      if (req.mode === 'navigate') {
        return caches.match('./');
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
