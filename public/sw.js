/* Pocket Ghillie service worker: existing data identities are preserved. */
const VERSION = "tl-v4-pocket-ghillie-lens";
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
  // Never cache private logbooks, keys, reports, subscription endpoints, or river API responses.
  if (url.pathname.startsWith("/.netlify/functions/") || url.pathname.startsWith("/api/")) return;

  // Weather: network first, fall back to the last saved response when offline
  if (url.hostname === "api.open-meteo.com") {
    e.respondWith(fetch(req).then(async res => {
      if (res.ok) {
        const headers = new Headers(res.headers); headers.set("X-TightLines-Cached-At", new Date().toISOString());
        const tagged = new Response(await res.clone().blob(), { status: res.status, headers });
        await (await caches.open(DATA)).put(req, tagged);
      }
      return res;
    }).catch(async () => {
      const hit = await caches.match(req);
      if (!hit) return Response.error();
      const headers = new Headers(hit.headers); headers.set("X-TightLines-Offline", "true");
      return new Response(await hit.blob(), { status: hit.status, headers });
    }));
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

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { body: "Open Pocket Ghillie to review your waters." }; }
  event.waitUntil(self.registration.showNotification(data.title || "Pocket Ghillie", {
    body: data.body || "New conditions update", icon: "/icon-192.png", badge: "/icon-192.png",
    tag: data.tag || "tightlines", data: { url: typeof data.url === "string" && data.url.startsWith("/") && !data.url.startsWith("//") ? data.url : "/" },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    const client = clients.find(c => c.url.startsWith(self.location.origin));
    if (client) return client.navigate(url).then(() => client.focus());
    return self.clients.openWindow(url);
  }));
});
