const CACHE_NAME = 'klaas-klaverjas-live'; // Naam mag nu constant blijven

// Bestanden die we zeker willen cachen voor offline gebruik
const CORE_ASSETS = [
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
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

// 1. Installeren (Zet de basis klaar)
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Dwingt de nieuwe SW direct actief te worden
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. Activeren (Oude caches opruimen)
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
  return self.clients.claim(); // Direct controle overnemen
});

// 3. De Slimme "Network First" Strategie
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // A. Firebase en API's NOOIT cachen (altijd live data)
  if (url.href.includes('firestore') || url.href.includes('googleapis.com')) {
    return; // Gebruik standaard netwerk gedrag
  }

  // B. Google Fonts: Stale-While-Revalidate (Snelheid + Update)
  // Fonts veranderen zelden, dus eerst cache tonen, dan op achtergrond updaten
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

  // C. JOUW SPELBESTANDEN: Network First (Altijd de nieuwste!)
  // Probeer eerst het internet. Lukt dat? Update de cache en toon de nieuwe versie.
  // Geen internet? Toon dan pas de oude versie.
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Het is gelukt via internet!
        // Maak een kopie voor de cache (voor de volgende keer als we offline zijn)
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Oeps, geen internet of server fout.
        // Geef de versie uit de cache terug.
        return caches.match(e.request);
      })
  );
});