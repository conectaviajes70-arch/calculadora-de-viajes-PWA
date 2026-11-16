const CACHE_NAME = 'conecta-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo2.png',
  './sw.js'
];

// Instalar y cachear
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Cache first, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            // Solo cachear respuestas válidas del mismo origen
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Si falla la red y no hay cache, devolver index
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
