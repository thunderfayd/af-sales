// AF Sales - Service Worker for offline support
const CACHE = 'af-sales-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './data.js',
  './app.jsx',
  './tweaks-stub.jsx',
  './map-leaflet.jsx',
  './legend-panel.jsx',
  './lead-drawer.jsx',
  './other-views.jsx',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for HTML so updates show up; cache-first for everything else
  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' ||
                 (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(event.request, copy));
          }
          return resp;
        }).catch(() => cached)
      )
    );
  }
});
