/* global self, caches, fetch, URL, Response */
import debug from 'debug';

const log = debug('app:serviceworker');

const version = __VERSION__;
const offlineResources = [
  '/',
  '/offline.html',
  '/offline-c5946202.svg',
];

const ignoreFetch = [
  /\/\/[^/]*mixpanel[^/]*\.com\//,
  /\/\/[^/]*mxpnl[^/]*\.com\//,
  /\/\/[^/]*segment[^/]*\.io\//,
  /\/\/[^/]*getclicky[^/]*\.com\//,
  /\/\/[^/]*typekit[^/]*\.net\//,
  /\/\/[^/]*disqus[^/]*\.com\//,
  /\/\/[^/]*google-analytics[^/]*\.com\//,
  /\/\/[^/]*list-manage[^/]*\.com\//,
  /\/\/zenkaffe\.herokuapp\.com\//,
  /\/__rack\//,
];

function cacheKey(...args) {
  return [version, ...args].join(':');
}

function cacheOfflineResources() {
  return caches
    .open(cacheKey('offline'))
    .then(cache => cache.addAll(offlineResources))
    .then(() => {
      log('installation complete!');
    });
}

function offlineResponse(request) {
  log('(offline)', request.method, request.url);

  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith('.html') || path.endsWith('/') || !path.endsWith('.js')) {
    return caches.match('/offline.html');
  }
  return new Response('', { status: 503, statusText: 'Service Unavailable' });
}

function removeOldCache() {
  // We return a promise that settles when all outdated caches are deleted.
  // Filter by keys that don't start with the latest version prefix.
  // Return a promise that's fulfilled when each outdated cache is deleted.
  return caches
    .keys()
    .then(keys => Promise.all(keys
      .filter(key => !key.startsWith(version))
      .map(key => caches.delete(key))))
    .then(() => {
      log('removeOldCache completed.');
    });
}

function shouldAlwaysFetch(request) {
  return __DEVELOPMENT__ ||
    request.method !== 'GET' ||
    ignoreFetch.some(regex => request.url.match(regex));
}

function shouldFetchAndCache(request) {
  return ~request.headers.get('Accept').indexOf('text/html');
}

// Stash response in cache as side-effect of network request
function networkedAndCache(request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(cacheKey('resources'))
        .then((cache) => {
          if (request.url.match(/^https?:\/\//)) cache.put(request, copy);
        });

      log('(network: cache write)', request.method, request.url);
      return response;
    });
}

function cachedOrNetworked(request) {
  return caches.match(request)
    .then((response) => {
      log(response ? '(cached)' : '(network: cache miss)', request.method, request.url);
      return response ||
        networkedAndCache(request).catch(() => offlineResponse(request));
    });
}

// function networkedOrOffline(request) {
//   return fetch(request)
//     .then((response) => {
//       log('(network)', request.method, request.url);
//       return response;
//     })
//     .catch(() => offlineResponse(request));
// }

function cachedOrOffline(request) {
  return caches
    .match(request)
    .then(response => response || offlineResponse(request));
}

function networkedOrCached(request) {
  return networkedAndCache(request)
    .catch(() => cachedOrOffline(request));
}

// ////////
// Install
// ////////
function onInstall(event) {
  log('install event in progress.');

  event.waitUntil(cacheOfflineResources());
}

// //////
// Fetch
// //////
function onFetch(event) {
  const { request } = event;

  if (shouldAlwaysFetch(request)) {
    log('shouldAlwaysFetch', request.url);
    return;
  }

  if (shouldFetchAndCache(request)) {
    log('shouldFetchAndCache', request.url);
    event.respondWith(networkedOrCached(request));
    return;
  }

  log('cachedOrNetworked', request.url);
  event.respondWith(cachedOrNetworked(request));
}

// /////////
// Activate
// /////////
function onActivate(event) {
  log('activate event in progress.');
  event.waitUntil(removeOldCache());
}

log('Hello from ServiceWorker land!', version);

self.addEventListener('install', onInstall);

self.addEventListener('fetch', onFetch);

self.addEventListener('activate', onActivate);
