'use strict';

const version = 'v20160418.4';
const offlineResources = [
  '/',
  '/offline.html'
];

const ignoreFetch = [
  /https?:\/\/api.mixpanel.com\//,
  /https?:\/\/api.segment.io\//,
  /https?:\/\/in.getclicky.com\//,
  /\/__rack\//,
];

const offlineImage = '<svg width="400" height="300" role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>';

//////////
// Install
//////////
function onInstall(event) {
  log('install event in progress.');

  event.waitUntil(updateStaticCache());
}

function updateStaticCache() {
  return caches
  .open(cacheKey('offline'))
  .then((cache) => {
    return cache.addAll(offlineResources);
  })
  .then(() => {
    // self.skipWaiting();
    log('installation complete!');
  });
}

////////
// Fetch
////////
function onFetch(event) {
  const request = event.request;

  /* We should only cache GET requests, and deal with the rest of method in the
     client-side, by handling failed POST,PUT,PATCH,etc. requests.
     */
  if (shouldAlwaysFetch(request)) {
    /* If we don't block the event as shown below, then the request will go to
       the network as usual.
       */
    log('(network)', request.method, request.url);
    event.respondWith(networkedOrOffline(request));
    return;
  }

  /* For HTML requests, try network first, then fallback to cache, then offline
  */
  if (shouldFetchAndCache(request)) {
    log("(network: cache write)", request.method, request.url);
    // event.respondWith(networkedAndCache(request));
    event.respondWith(
      fetch(request)
      .then(function (response) {
        // Stash a copy of this page in the cache
        var copy = response.clone();
        caches.open(cacheKey('resources'))
          .then(function (cache) {
            cache.put(request, copy);
          });

        return response;
      })
      .catch(function (arg) {
        log("error on fetch", arg);
        return caches.match(request)
          .then(function (response) {
            return response || caches.match('/offline.html');
          })
      })
    );
    return;
  }

  /* Similar to event.waitUntil in that it blocks the fetch event on a promise.
     Fulfillment result will be used as the response, and rejection will end in a
     HTTP response indicating failure.
     For non-HTML requests, look in cache, then fallback to network.
     */

  event.respondWith(cachedOrNetworked(request));
}

function cachedOrNetworked(request) {
  return caches.match(request)
    .then(function (response) {
      log(response ? '(cached)' : '(network: cache miss)', request.url);
      return response || fetch(request)
        .catch(function () {
          if (~request.headers.get('Accept').indexOf('image')) {
            return new Response(offlineImage, { headers: { 'Content-Type': 'image/svg+xml' }});
          }
        });
    })
}

// function cachedOrNetworked(event) {
//   const request = event.request;
//
//   return caches
//   .match(request)
//   .then((cached) => {
//     #<{(| Even if the response is in our cache, we go to the network as well.
//        This pattern is known for producing "eventually fresh" responses,
//        where we return cached responses immediately, and meanwhile pull
//        a network response and store that in the cache.
//        Read more: https://ponyfoo.com/articles/progressive-networking-serviceworker
//        We return the cached response immediately if there is one, and fall
//        back to waiting on the network as usual.
//        |)}>#
//     let networked = networkedAndCache(request);
//     log('cachedOrNetwork', cached ? '(cached)' : '(network)', request.url);
//     return cached || networked;
//   });
// }

function networkedOrOffline(request) {
  return fetch(request)
  .catch(() => {
    return caches.match('/offline.html');
  });
}

function networkedAndCache(request) {
  return fetch(request)
  .then((response) => {
    const copy = response.clone();
    caches
    .open(cacheKey('resources'))
    .then((cache) => {
      cache.put(request, copy);
    })
    .then(() => {
      log('added to cache', request.url);
    });

    return response;
  })
  .catch(() => { unableToResolve(request) });
}

function unableToResolve(request) {
  return caches
  .match(request)
  .then((response) => {
    return response || caches.match('/offline.html');
  });
}

///////////
// Activate
///////////
function onActivate(event) {
  log('activate event in progress.');
  event.waitUntil(removeOldCache());
}

function removeOldCache() {
  return caches
  .keys()
  .then((keys) => {
    return Promise.all( // We return a promise that settles when all outdated caches are deleted.
                       keys
                       .filter((key) => {
                         return !key.startsWith(version); // Filter by keys that don't start with the latest version prefix.
                       })
                       .map((key) => {
                         return caches.delete(key); // Return a promise that's fulfilled when each outdated cache is deleted.
                       })
                      );
  })
  .then(() => {
    log('removeOldCache completed.');
  });
}

function cacheKey() {
  return [version, ...arguments].join(':');
}

function log() {
  if (developmentMode()) {
    console.log("SW:", ...arguments);
  }
}

function shouldAlwaysFetch(request) {
  return __DEVELOPMENT__ ||
    request.method !== 'GET' ||
      ignoreFetch.some(regex => request.url.match(regex));
}

function shouldFetchAndCache(request) {
  return ~request.headers.get('Accept').indexOf('text/html');
}

function developmentMode() {
  return __DEVELOPMENT__ || __DEBUG__;
}

log("Hello from ServiceWorker land!", version);

self.addEventListener('install', onInstall);

self.addEventListener('fetch', onFetch);

self.addEventListener("activate", onActivate);
