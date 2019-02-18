import debug from 'debug';

const log = debug('app:enhance');

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach(registration => registration.unregister());
  });
} else {
  log('service worker is not supported.');
}
