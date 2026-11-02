// Service worker minimal : met en cache l'interface (pas les données) pour un chargement
// rapide sur connexion faible. Les appels /api ne sont JAMAIS mis en cache (confidentialité).
const CACHE = "sunu-shell-v2";
const SHELL = ["/", "/index.html", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api")) return;

  if (event.request.mode === "navigate") {
    // Réseau d'abord, interface en cache si hors ligne.
    event.respondWith(fetch(event.request).catch(() => caches.match("/index.html")));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    // Fichiers versionnés : cache d'abord.
    event.respondWith(
      caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })),
    );
  }
});
