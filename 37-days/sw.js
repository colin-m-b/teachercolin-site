// 37 Days — service worker for offline mode only. Network first; the cache is the Wi-fi backup.
// It never touches the game API.
const CACHE = 'd37-offline-v1';
const FILES = ['offline.html', 'assets/37days.css', 'assets/projector.css', 'assets/common.js', 'assets/map.js', 'assets/offline.js',
  'engine/scenario.js', 'engine/content.js', 'engine/engine.js', 'engine/extras.js', 'engine/menu-variants.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
