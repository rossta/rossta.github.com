// ServiceWorker is a progressive technology. Ignore unsupported browsers
if('serviceWorker' in navigator) {
  log('service worker registration in progress.');
  navigator.serviceWorker.register('/serviceworker.js', {
    scope: '/'
  }).then(function() {
    log('service worker registration complete.');
  }, function() {
    log('service worker registration failure.');
  });
} else {
  log('service worker is not supported.');
}

function log() {
  if (__DEVELOPMENT__) {
    console.log("CLIENT:", ...arguments);
  }
}
