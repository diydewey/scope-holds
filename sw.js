// Offline cache: the app files load from the network when it answers within 3 s, otherwise from the cache.
// Weather requests (another site) are not touched.
const CACHE = "scope-holds-v14";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png", "favicon-64.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== "GET") return;
  const cached = caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"));
  const net = fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  e.respondWith(new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    const t = setTimeout(() => cached.then(finish), 3000);
    net.then(r => { clearTimeout(t); finish(r); }).catch(() => cached.then(r => finish(r || Response.error())));
  }));
});
