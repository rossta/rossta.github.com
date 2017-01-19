'use strict';

const version = __VERSION__;
const offlineResources = [
  '/',
  '/offline.html',
  '/offline.svg'
];

const ignoreFetch = [
  /\/\/[^\/]*mixpanel[^\/]*\.com\//,
  /\/\/[^\/]*mxpnl[^\/]*\.com\//,
  /\/\/[^\/]*segment[^\/]*\.io\//,
  /\/\/[^\/]*getclicky[^\/]*\.com\//,
  /\/\/[^\/]*typekit[^\/]*\.net\//,
  /\/\/[^\/]*disqus[^\/]*\.com\//,
  /\/\/[^\/]*google-analytics[^\/]*\.com\//,
  /\/\/[^\/]*list-manage[^\/]*\.com\//,
  /\/\/zenkaffe\.herokuapp\.com\//,
  /\/__rack\//,
];

//////////
// Install
//////////
function onInstall(event) {
  log('install event in progress.');

  event.waitUntil(cacheOfflineResources());
}

function cacheOfflineResources() {
  return caches
    .open(cacheKey('offline'))
    .then((cache) => {
      return cache.addAll(offlineResources);
    })
    .then(() => {
      log('installation complete!');
    });
}

////////
// Fetch
////////
function onFetch(event) {
  const request = event.request;

  if (shouldAlwaysFetch(request)) {
    console.log('shouldAlwaysFetch', request.url)
    return;
  }

  if (shouldFetchAndCache(request)) {
    console.log('shouldFetchAndCache', request.url)
    event.respondWith(networkedOrCached(request));
    return;
  }

  console.log('cachedOrNetworked', request.url)
  event.respondWith(cachedOrNetworked(request));
}

function networkedOrCached(request) {
  return networkedAndCache(request)
    .catch(() => { return cachedOrOffline(request) });
}

// Stash response in cache as side-effect of network request
function networkedAndCache(request) {
  return fetch(request)
    .then((response) => {
      var copy = response.clone();
      caches.open(cacheKey('resources'))
        .then((cache) => {
          cache.put(request, copy);
        });

      log("(network: cache write)", request.method, request.url);
      return response;
    });
}

function cachedOrNetworked(request) {
  return caches.match(request)
    .then((response) => {
      log(response ? '(cached)' : '(network: cache miss)', request.method, request.url);
      return response ||
        networkedAndCache(request)
          .catch(() => { return offlineResponse(request) });
    });
}

function networkedOrOffline(request) {
  return fetch(request)
    .then((response) => {
      log('(network)', request.method, request.url);
      return response;
    })
    .catch(() => {
      return offlineResponse(request);
    });
}

function cachedOrOffline(request) {
  return caches
    .match(request)
    .then((response) => {
      return response || offlineResponse(request);
    });
}

function offlineResponse(request) {
  log('(offline)', request.method, request.url);

  let url = new URL(request.url);
  let path = url.pathname;

  if (path.endsWith(".html") || path.endsWith("/") || !path.endsWith(".js")) {
    return caches.match('/offline.html');
  } else {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });;
  }
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
