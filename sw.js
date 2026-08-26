const CACHE_NAME = 'bordero-cache-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para chamadas à API (jsonbin), licenças e libs externas; cache-first para o resto (funciona offline)
self.addEventListener('fetch', (event) => {
  const reqUrl = new URL(event.request.url);
  const networkFirstHosts = [
    'api.jsonbin.io',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com'
  ];
  const isNetworkFirstHost = networkFirstHosts.includes(reqUrl.hostname);
  const isLicensesFile = reqUrl.origin === self.location.origin && reqUrl.pathname.endsWith('/licenses.json');

  if (isNetworkFirstHost || isLicensesFile) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
