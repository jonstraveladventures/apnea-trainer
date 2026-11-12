// Offline support. On install the worker caches the app shell plus every file
// the build lists in asset-manifest.json (the main bundle and the separately
// loaded chunks for each window), so every part of the app works offline
// after the first visit, not only the parts that were opened while online.
const CACHE_NAME = 'apnea-trainer-v3';

const SHELL_URLS = [
  '.',
  './index.html',
  './manifest.json',
  './audio/countdown-5-4-3-2-1.mp3',
  './icon-192.png',
  './icon-512.png',
];

/** Built files to cache, read from the build's asset manifest (absent in development). */
async function buildAssetUrls() {
  try {
    const res = await fetch('./asset-manifest.json', { cache: 'reload' });
    if (!res.ok) return [];
    const manifest = await res.json();
    return Object.values(manifest.files || {}).filter(
      (url) => typeof url === 'string' && !url.endsWith('.map') && !url.endsWith('.LICENSE.txt')
    );
  } catch (e) {
    return [];
  }
}

/** Cache each URL on its own so a single failure doesn't abort the install. */
function cacheEach(cache, urls) {
  return Promise.all(
    urls.map((url) =>
      fetch(url, { cache: 'reload' })
        .then((res) => (res.ok ? cache.put(url, res) : null))
        .catch(() => null)
    )
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const assets = await buildAssetUrls();
      await cacheEach(cache, [...SHELL_URLS, ...assets]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions of this worker.
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));

      // Drop hashed bundles from earlier builds that the current build no longer uses.
      const current = new Set((await buildAssetUrls()).map((u) => new URL(u, self.location).href));
      if (current.size > 0) {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((req) => new URL(req.url).pathname.includes('/static/') && !current.has(req.url))
            .map((req) => cache.delete(req))
        );
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin GETs; third-party requests go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Pages: network first so an update shows as soon as you're online,
  // the cached page when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: cache first, filling the cache on a miss. A file that is
  // neither cached nor reachable fails as a network error; it is never
  // answered with the HTML page, which a script would fail to parse.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return res;
      });
    })
  );
});
