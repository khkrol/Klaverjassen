// Versie omhoog naar v3
const CACHE_NAME = 'lumina-klaverjas-v3';

const ASSETS = [
  './',
  './index.html',
  './css/global.css',
  './css/game.css',
  './js/klaverjas-core.js',
  './js/klaverjas-main.js',
  './js/klaverjas-ui.js',
  './js/klaverjas-config.js',
  './js/firebase-config.js',      // NIEUW: Toegevoegd
  './js/leaderboard-service.js',  // NIEUW: Toegevoegd
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'  
];

// 1. Installeren
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activeren & Oude rommel opruimen
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
  return self.clients.claim();
});

// 3. Fetch (Network first, fallback cache)
self.addEventListener('fetch', (e) => {
  // Alleen http/https verzoeken cachen (geen chrome-extensies etc)
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});