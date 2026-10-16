/* KasSave service worker minimal: bikin PWA installable + cache shell dasar.
   API dan halaman dinamis tetap network-first agar data kas tidak basi. */
const CACHE = 'kassave-v1';
const CORE = ['/', '/publik', '/unduh', '/manifest.webmanifest', '/logo.png', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Jangan cache API / auth Supabase: selalu ke jaringan.
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/publik')))
  );
});
