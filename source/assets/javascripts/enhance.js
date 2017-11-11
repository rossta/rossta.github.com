import debug from 'debug';
const log = debug('app:enhance');

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if('serviceWorker' in navigator) {
  log('service worker registration in progress.');
  navigator.serviceWorker.register('/serviceworker.js', {
    scope: '/'
  }).then((registration) => {
    log('service worker is registered!');
      var serviceWorker;
      if (registration.installing) {
          serviceWorker = registration.installing;
          log('service worker is now installing');
      } else if (registration.waiting) {
          serviceWorker = registration.waiting;
          log('service worker is now waiting');
      } else if (registration.active) {
          serviceWorker = registration.active;
          log('service worker is now active');
      }
      if (serviceWorker) {
        log('service worker state:', serviceWorker.state);
        serviceWorker.addEventListener('statechange', function (e) {
          log('service worker state:', serviceWorker.state);
        });
      }
  }).catch (function (error) {
    log('service worker failed to register.', error);
  });
} else {
  log('service worker is not supported.');
}
