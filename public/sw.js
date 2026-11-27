const CACHE = 'cpns-prep-v2'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
// Jaringan dulu, cadangan dari cache bila offline. Hanya GET same-origin.
self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); return res })
      .catch(() => caches.match(r).then((m) => m || caches.match('./'))),
  )
})
