const CACHE_NAME = 'bordero-cache-v2';
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

// index.html e manifest.json: sempre busca a versão mais nova quando online (network-first),
// evitando ficar preso numa versão antiga do cache. Offline, cai no cache normalmente.
// Libs externas e licença: sempre network (não cacheia). Resto (ícones etc): cache-first.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes('api.jsonbin.io') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')
      || url.includes('licenses.json') || url.includes('cdnjs.cloudflare.com')
      || url.includes('tessdata') || url.includes('tesseract') || url.includes('pdf.js') || url.includes('pdf.worker')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  if (url.endsWith('index.html') || url.endsWith('/') || url.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
