/* WorthBook offline cache — static assets only */
const CACHE = "worthbook-static-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok && (req.destination === "document" || req.destination === "script" || req.destination === "style" || req.destination === "image" || req.destination === "font" || url.pathname.endsWith(".webmanifest"))) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await cache.match("./") || await cache.match("index.html");
          if (fallback) return fallback;
        }
        throw new Error("offline");
      }
    }),
  );
});
