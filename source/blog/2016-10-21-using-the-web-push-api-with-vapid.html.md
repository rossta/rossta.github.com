---
title: Using the Push API with VAPID
author: Ross Kaffenberger
published: false
summary: Sending push notifications in Ruby or Node.js on the open web
description: Using the Web Push API in Ruby or Node.js to send push notifications on the open web
pull_image: 'blog/stock/horsehead-nebula-pexels-photo.jpeg'
series: Service Worker
category: Code
tags:
  - Rails
  - JavaScript
---

Push messages from mobile and desktop browsers are [now a thing](http://caniuse.com/#feat=push-api) on the open web.

![Push message in Chrome](blog/screenshots/screenshot-sw-sandbox-push-simple-3)

Why use the Push API? It allows you to use (free) services to notify your users
of events, even when they're not actively engaged with your site. It's
not meant to replace other methods of pushing data to clients, like
[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) or [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), but can be useful for sending small, infrequent payloads to keep users engaged. Think: a build has finished successfully, a new post was published, a touchdown was scored.  What's
common place on your smartphone from installed apps is now possible from the browser. Though only active, at the time of this writing, in Chrome and Firefox on the desktop and in Chrome on Android, it'll be more widespread soon enough.

In this post, we'll walk through setting up a Ruby or Node.js web application to use the Push API. While I previously [wrote about this topic](/blog/web-push-notifications-from-rails.html), there have been recent changes in the Chrome implementation to make the API consistent with Firefox, which we'll get into here.

## Overview

There are three parties involved in delivering a push message.

* Your application server
* Your user
* A push server, e.g., Google or Mozilla

Before a push message can be delivered, a few criteria must (or may) be
satisfied:

1. Your application server has generated a set of [Voluntary Application server Identification (VAPID)](https://tools.ietf.org/html/draft-ietf-webpush-vapid-01) keys that will be used to sign Push API requests. This is a one-time, optional step (at least until you decide to reset the keys).
2. To send messages through Chrome, you have registered your site through the [Google Developer Console](https://console.developers.google.com/).
3. A `'manifest.json'` file, linked from a page on your website, identifies your app settings.
5. In the user's web browser, a service worker is installed and activated and its `pushManager` property is subscribed to push events with your VAPID public key, with creates a `subscription` JSON object on the client side.
6. Your server makes an API request to a push server (likely using a server-side library) to send a notification with the `subscription` obtained from the client and an optional payload (the message).
7. Your service worker is set up to receive `'push'` events. To trigger a desktop notification, the user has accepted the prompt to receive notifications from your site.

## Generating VAPID keys

Push servers from Google and Mozilla now both leverage the Voluntary Application
Server Identification (VAPID) protocol. This protocol allows application servers to identify themselves to the push servers so browser subscriptions can be properly restricted to their application servers. In other words, it could theoretically prevent an attacker from stealing a user `subscription` and sending push messages to that recipient from another server.

To take advantage of the VAPID protocol, you would generate a public/private
VAPID key pair to store on your server to be used for all user subscriptions.

In Ruby, we can use the `webpush` gem to generate a VAPID key that has both a `public_key` and `private_key` attribute to be saved on the server side.

```ruby
# Gemfile
gem 'webpush'
```

In a Ruby console:

```ruby
require 'webpush'

# One-time, on the server
vapid_key = Webpush.generate_key

# Save these in your application server settings
vapid_key.public_key
# => "BC1mp...HQ="

vapid_key.private_key
# => "XhGUr...Kec"
```

In Node.js, you can use the `web-push` package:

```bash
npm install web-push --save
```

In the node REPL:

```javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys()

vapidKeys.publicKey
'BDO0P...eoH'

vapidKeys.privateKey
'3J303..r4I'
```

The keys returned will both be Base64-encoded byte strings. Only the public key
will be shared, both with the user's browser and the push server as we'll see
later.

Setting VAPID details is optional in Firefox and appears to be required in Chrome if not using GCM API credentials as [described previously]()). Since you probably have users from both browsers, you may as well set VAPID details for all.

## Declaring manifest.json

Add a `manifest.json` file served at the scope of your app (or above), like at the root to describe your client application for use with the Push API.

```javascript
{
  "name": "My App",
  "short_name": "my-app",
  "start_url": "/",
  "icons": [
    {
      "src": "/images/my-push-logo-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Link to it somewhere in the `<head>` tag:

```html
<!-- index.html -->
<link rel="manifest" href="/manifest.json" />
```

## Installing a service worker

Your application javascript must register a service worker script at an appropriate scope (we're sticking with the root).

```javascript
// application.js
// Register the serviceWorker script at /serviceworker.js from your server if supported
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/serviceworker.js')
    .then(function(reg) {
       console.log('Service worker change, registered the service worker');
    });
}
// Otherwise, no push notifications :(
else {
  console.error('Service worker is not supported in this browser');
}
```

## Subscribing to push notifications

The VAPID public key you generated earlier is made available to the client as a `UInt8Array`. To do this, one way would be to expose the urlsafe-decoded bytes from Ruby to JavaScript when rendering the HTML template.

In Ruby, we might embed the key as raw bytes from the application `ENV` or some other application settings mechanism into an HTML template with help from the `Base64` module in the standard library. Global variables are used here for simplicity.

```html
<script>
window.vapidPublicKey = new Uint8Array(<%= Base64.urlsafe_decode64(ENV['VAPID_PUBLIC_KEY']).bytes %>);
</script>
```

In Node.js, we could use the `urlsafe-base64` package to decode the public key
and convert it to raw bytes:

```javascript
<script>
window.vapidPublicKey = new Uint8Array(<%= urlsafeBase64.decode(process.env.VAPID_PUBLIC_KEY) %>);
</script>
```

Your application javascript would then use the `navigator.serviceWorker.pushManager` to subscribe to push notifications, passing the VAPID public key to the subscription settings.

```javascript
// application.js
// When serviceWorker is supported, installed, and activated,
// subscribe the pushManager property with the vapidPublicKey
navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {
  serviceWorkerRegistration.pushManager
  .subscribe({
    userVisibleOnly: true,
    applicationServerKey: window.vapidPublicKey
  });
});
```

## Triggering a web push notification

Hook into an client-side or backend event in your app to deliver a push message. The server must be made aware of the `subscription`. In the example below, we send the JSON generated subscription object to our backend at the "/push" endpoint with a message.

```javascript
// application.js
// Send the subscription and message from the client for the backend
// to set up a push notification
$('.webpush-button').on('click', (e) => {
  navigator.serviceWorker.ready
  .then((serviceWorkerRegistration) => {
    serviceWorkerRegistration.pushManager.getSubscription()
    .then((subscription) => {
      $.post('/push', { subscription: subscription.toJSON(), message: 'You clicked a button!' });
    });
});
```

Imagine a Ruby app endpoint that responds to the request by triggering notification through the `webpush` gem. VAPID details include a URL or mailto address for your website and the Base64-encoded public/private VAPID key pair you generated earlier.

```ruby
# app.rb
post '/push' do
  Webpush.payload_send(
    message: params[:message]
    endpoint: params[:subscription][:endpoint],
    p256dh: params[:subscription][:keys][:p256dh],
    auth: params[:subscription][:keys][:p256dh],
    ttl: 24 * 60 * 60,
    vapid: {
      subject: 'mailto:sender@example.com',
      public_key: ENV['VAPID_PUBLIC_KEY'],
      private_key: ENV['VAPID_PRIVATE_KEY']
    }
  )
end
```

In Node.js, usage of the `web-push` package might look like this:

```javascript
# index.js
const webpush = require('web-push');

// ...

app.post('/push', function(request, response) {
  const subscription = request.param('subscription');
  const message = request.param('message');

  setTimeout(() => {
    const options = {
      vapidDetails: {
        subject: 'mailto:sender@example.com',
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
      },
      TTL: 24 * 60 * 60
    }

    webpush.sendNotification(
      subscription,
      message,
      options
    );

  }, 0);

  response.send('OK');
});
```

## Receiving the push event

Your `/serviceworker.js` script can respond to `'push'` events to trigger desktop notifications by calling `showNotification` on the `registration` property.

```javascript
// serviceworker.js
// The serviceworker context can respond to 'push' events and trigger
// notifications on the registration property
self.addEventListener("push", (event) => {
  let title = (event.data && event.data.text()) || "Yay a message";
  let body = "We have received a push message";
  let tag = "push-simple-demo-notification-tag";
  let icon = '/assets/my-logo-120x120.png';

  event.waitUntil(
    self.registration.showNotification(title, { body, icon, tag })
  )
});
```

Before the notifications can be displayed, the user must grant permission for [notifications](https://developer.mozilla.org/en-US/docs/Web/API/notification) in a browser prompt, using something like the example below.

```javascript
// application.js

// Let's check if the browser supports notifications
if (!("Notification" in window)) {
  console.error("This browser does not support desktop notification");
}

// Let's check whether notification permissions have already been granted
else if (Notification.permission === "granted") {
  console.log("Permission to receive notifications has been granted");
}

// Otherwise, we need to ask the user for permission
else if (Notification.permission !== 'denied') {
  Notification.requestPermission(function (permission) {
    // If the user accepts, let's create a notification
    if (permission === "granted") {
      console.log("Permission to receive notifications has been granted");
    }
  });
}
```

If everything worked, you should see a browser notification triggered via Push.
