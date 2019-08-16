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


window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.menu-icon a').addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = event.target.closest('.top-bar')
    if (menu.style.height) menu.style.height = null;
    else menu.style.height = 'auto';
  });
});
