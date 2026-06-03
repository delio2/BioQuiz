const CACHE_NAME = 'bioquiz-v18';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/quizLogic.js',
  './js/storage.js',
  './js/defaultQuestions.js',
  './js/graphicQuestions.js',
  './manifest.json',
  './icons/icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/smiles-drawer@2/dist/smiles-drawer.min.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forza l'aggiornamento immediato del service worker senza aspettare che le tab vengano chiuse
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Elimino vecchia cache:', cacheName);
            return caches.delete(cacheName); // Elimina tutte le vecchie versioni
          }
        })
      );
    }).then(() => self.clients.claim()) // Il nuovo service worker prende subito il controllo
  );
});

self.addEventListener('fetch', (e) => {
  // Network first, poi fallback sulla cache (utile in fase di sviluppo continuo per avere sempre i file freschi)
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
