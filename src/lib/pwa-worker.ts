// A network-only worker for the app. Only the public offline fallback is cached.
export function pwaWorker(version: string) {
  return `"use strict";
const CACHE = ${JSON.stringify(`olu-offline-${version}`)};
const PUBLIC_FILES = ["/offline.html", "/pwa/offline.css", "/pwa/offline.js"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of PUBLIC_FILES) {
      const response = await fetch(path, { cache: "reload", credentials: "omit" });
      if (!response.ok || response.redirected) throw new Error("Offline shell unavailable");
      await cache.put(path, response);
    }
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("olu-offline-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // Exact public paths only; never cache private pages, RSC, API or photo bytes.
  if (PUBLIC_FILES.includes(url.pathname) && !url.search) {
    event.respondWith((async () => (await (await caches.open(CACHE)).match(url.pathname)) || fetch(request))());
    return;
  }
  if (request.mode !== "navigate") return;
  event.respondWith((async () => {
    try { return await fetch(request); }
    catch {
      return (await (await caches.open(CACHE)).match("/offline.html")) || new Response("You are offline. Reconnect and try again.", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  })());
});
`;
}
