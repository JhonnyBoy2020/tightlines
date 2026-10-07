/* TightLines service worker — app shell offline, last forecast offline, map tiles cached */
const VERSION = "tl-v2";
const SHELL = `${VERSION}-shell`, DATA = `${VERSION}-data`, TILES = `${VERSION}-tiles`;
const MAX_TILES = 600;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(name, max) {
  const c = await caches.open(name); const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Weather: network first, fall back to the last saved response when offline
  if (url.hostname === "api.open-meteo.com") {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(DATA).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || Response.error())));
    return;
  }
  // Map tiles: cache first
  if (/tile\.openstreetmap\.org|arcgisonline\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(TILES).then((c) => c.put(req, copy)).then(() => trim(TILES, MAX_TILES)); return res; })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Page navigations: network first, offline → cached shell
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put("/index.html", copy)); return res; }).catch(() => caches.match("/index.html")));
    return;
  }
  // Built assets (hashed): cache first
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); } return res; })));
});
