'use strict';

const version = 'v1';
const offlineResources = [
  '/',
  '/offline.html'
];

var ignoreFetch = [
  /https?:\/\/api.mixpanel.com\//,
  /https?:\/\/api.segment.io\//,
  /https?:\/\/in.getclicky.com\//,
  /\/__rack\//,
]

self.addEventListener('install', (event) => {
  log('install event in progress.');

  event.waitUntil(
    caches
    .open(cachekey('offline'))
    .then((cache) => {
      return cache.addAll(offlineResources);
    })
    .then(() => {
      self.skipWaiting();
      log('installation complete!');
    })
  );
});

self.addEventListener('fetch', (event) => {
  log('fetch event', event);

  /* We should only cache GET requests, and deal with the rest of method in the
     client-side, by handling failed POST,PUT,PATCH,etc. requests.
     */
  if (ignoreFetchEvent(event)) {
    /* If we don't block the event as shown below, then the request will go to
       the network as usual.
       */
    log('fetch event ignored.', event.request.method, event.request.url);
    return;
  }

  /* Similar to event.waitUntil in that it blocks the fetch event on a promise.
     Fulfillment result will be used as the response, and rejection will end in a
     HTTP response indicating failure.
     */
  event.respondWith(
    caches
    .match(event.request)
    .then((cached) => {
      /* Even if the response is in our cache, we go to the network as well.
         This pattern is known for producing "eventually fresh" responses,
         where we return cached responses immediately, and meanwhile pull
         a network response and store that in the cache.
         Read more:
https://ponyfoo.com/articles/progressive-networking-serviceworker
*/
      let networked = fetch(event.request).then(fetchedFromNetwork(event));
      // .then(fetchedFromNetwork(event), unableToResolve(event))
      // .catch(unableToResolve);

      /* We return the cached response immediately if there is one, and fall
         back to waiting on the network as usual.
         */
      log('fetch event', cached ? '(cached)' : '(network)', event.request.url);

      return cached || networked;
    })
  );
});

self.addEventListener("activate", (event) => {
  /* Just like with the install event, event.waitUntil blocks activate on a promise.
     Activation will fail unless the promise is fulfilled.
     */
  log('activate event in progress.');

  event.waitUntil(
    caches
    // This method returns a promise which will resolve to an array of available cache keys.
    .keys()
    .then((keys) => {
      // We return a promise that settles when all outdated caches are deleted.
      return Promise.all(
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
      log('activate completed.');
    })
  );
});

function cachekey() {
  return [version, ...arguments].join(':');
}

function log() {
  if (__DEVELOPMENT__) {
    console.log("SW:", ...arguments);
  }
}

function fetchedFromNetwork(event) {
  return function cacheAndRespond(response) {
    /* We copy the response before replying to the network request.
       This is the response that will be stored on the ServiceWorker cache.
       */
    let cacheCopy = response.clone();
    log('fetch response from network', event.request.url);

    // We open a cache to store the response for this request
    caches
    .open(cachekey('pages'))
    .then((cache) => {
      /* We store the response for this request. It'll later become
         available to caches.match(event.request) calls, when looking
         for cached responses.
         */
      cache.put(event.request, cacheCopy);
    })
    .then(() => {
      log('fetch response stored in cache.', event.request.url);
    });

    return response;
  }
}

function unableToResolve(event) {
  return function handleRequestFailure(response) {
    /* When this method is called, it means we were unable to produce a response
       from either the cache or the network. This is our opportunity to produce
       a meaningful response even when all else fails. It's the last chance, so
       you probably want to display a "Service Unavailable" view or a generic
       error response.
       There's a couple of things we can do here.
       - Test the Accept header and then return one of the `offlineFundamentals`
       e.g: `return caches.match('/some/cached/image.png')`
       - You should also consider the origin. It's easier to decide what
       "unavailable" means for requests against your origins than for requests
       against a third party, such as an ad provider
       - Generate a Response programmaticaly, as shown below, and return that
          return new Response('<h1>Service Unavailable</h1>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
       */
    log('fetch request failed in both cache and network', event);
  }
}

function ignoreFetchEvent(event) {
  return event.request.method !== 'GET' || ignoreFetch.some(regex => event.request.url.match(regex));
}

log("Hello from ServiceWorker land!", version);