const CACHE_NAME = 'klaas-klaverjas-v2'; // Versie opgehoogd

// Alleen je eigen lokale bestanden
const CORE_ASSETS = [
  './',
  './index.html',
  './css/global.css',
  './css/game.css',
  './js/klaverjas-core.js',
  './js/klaverjas-main.js',
  './js/klaverjas-ui.js',
  './js/klaverjas-config.js',
  './js/firebase-config.js',
  './js/leaderboard-service.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. Installeren
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Core Assets cachen');
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. Activeren & Opruimen
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// 3. Slimmere Fetch Strategy
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // A. Google Fonts strategie (Stale-while-revalidate)
  // We cachen fonts zodat ze offline werken, maar proberen ze wel te updaten.
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          const fetchPromise = fetch(e.request).then((networkResponse) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // B. Firebase / API calls NIET cachen (anders zien spelers oude scores)
  if (url.href.includes('firestore') || url.href.includes('googleapis.com/v1/projects')) {
    return; // Gewoon het netwerk gebruiken
  }

  // C. Standaard App bestanden (Cache First, Network Fallback)
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {
        // Optioneel: toon een offline.html pagina als ook het netwerk faalt
        // en de pagina niet in de cache zit.
      });
    })
  );
});