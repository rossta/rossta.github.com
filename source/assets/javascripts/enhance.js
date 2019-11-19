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
  document.querySelectorAll('.top-bar-menu-button').forEach(el => {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleClass(document.querySelector('.top-bar-section'), 'hidden');
      el.querySelectorAll('.icon').forEach(ic => toggleClass(ic, 'hidden'));
    })
  });
});

function toggleClass(el, className) {
  if (el.classList.contains(className)) {
    el.classList.remove(className)
  } else {
    el.classList.add(className)
  }
}
