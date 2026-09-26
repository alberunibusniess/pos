/* The service worker is what makes the app work with the phone in flight
   mode: it keeps a copy of the page itself, so after the first visit
   nothing is ever fetched again unless a new version is published. */
const CACHE = "pos-v8";
const FILES = ["./", "./index.html", "./manifest.webmanifest",
               "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES).catch(() => {}))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE)
      .map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Cache first: the shop must open instantly and work with no signal.
  // A fresh copy is fetched quietly in the background for next time.
  e.respondWith(caches.match(e.request).then((hit) => {
    const live = fetch(e.request).then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit);
    return hit || live;
  }));
});
