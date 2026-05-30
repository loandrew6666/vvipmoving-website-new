const CACHE_NAME = "vvipmoving-shell-v1";
const RUNTIME_CACHE = "vvipmoving-runtime-v1";
const IMAGE_DOMAINS = [
  "https://i.ytimg.com",
  "https://img.youtube.com",
  "https://static.wixstatic.com",
  "https://files.manuscdn.com",
];

function cacheFirst(event) {
  return event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => cachedResponse || new Response(null, { status: 504 }));
    })
  );
}

function networkFirst(event) {
  return event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isImage = event.request.destination === "image" || /\.(png|jpe?g|webp|avif|svg)$/.test(url.pathname);
  const isFont = event.request.destination === "font";
  const isAsset = isSameOrigin && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/src/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js"));
  const isPrecache = isSameOrigin && (url.pathname === "/" || url.pathname.endsWith("/index.html"));
  const isThirdPartyImage = IMAGE_DOMAINS.some((domain) => event.request.url.startsWith(domain));

  if (isPrecache) {
    return networkFirst(event);
  }

  if (isAsset || isFont || isImage || isThirdPartyImage) {
    return cacheFirst(event);
  }

  return networkFirst(event);
});
