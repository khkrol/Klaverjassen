// Verander dit nummer ELKE KEER als je een update doet aan je site (bijv. v1.1, v1.2)
const CACHE_NAME = 'klaverjas-v2-network-first';

const ASSETS = [
  './',
  './index.html',
  './css/global.css',
  './css/game.css',
  './js/klaverjas-core.js',
  './js/klaverjas-main.js',
  './js/klaverjas-ui.js',
  './js/klaverjas-config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
  ];

// 1. Installeren: Cache de basisbestanden, maar forceer direct de nieuwe worker
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forceer dat deze nieuwe versie direct actief wordt
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activeren: Verwijder oude caches (belangrijk om ruimte te maken en conflicten te voorkomen)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Oude cache verwijderd:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Neem direct controle over alle tabbladen
});

// 3. Fetch: "Network First" Strategie
// Probeer eerst het internet. Lukt dat? Update de cache en toon de pagina.
// Lukt dat niet (offline)? Toon de versie uit de cache.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Maak een kopie van het antwoord om in de cache te stoppen
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => {
        // Geen internet? Pak de cache.
        return caches.match(e.request);
      })
  );
});