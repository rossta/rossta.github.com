---
title: Sending Web Push Notifications from Rails
author: Ross Kaffenberger
published: false
summary: Web Push Notifications from Rails
description: Web Push Notifications from Rails
pull_image: 'blog/stock/guitarist-pexels-photo.jpeg'
series: Service Worker
category: Code
tags:
  - Rails
  - JavaScript
---

We've had push notifications in our mobile and desktop apps for sometime. It's now becoming possible on the open web.

I'm going to share how to use the new [Web Push API](https://www.w3.org/TR/push-api/) from a Rails (or any Ruby) web application to push desktop notifications through supporting browsers - currently Chrome and Firefox at the time of this writing. Push notifications are powerful because they allow you to engage with your users even when they're not actively viewing your site.

We'll cover the basics of implementing Push yourself though it's interesting to note that third party services are already stepping in to do some of the technical work for you, like [Roost](https://goroost.com/), [PushCrew](https://pushcrew.com/), or
[OneSignal](https://onesignal.com/webpush).

<div class="callout panel">
<p>
  The <a href="https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html">Apple Push Notification Service</a> has made push notifications available to Safari since 2013. While there are some <a href="http://samuli.hakoniemi.net/how-to-implement-safari-push-notifications-on-your-website/">nice tutorials</a> for implementing Apple Push for the web, coming support for open Web Push in Safari is currently unknown.
</p>
</div>

## Demo

Want to see it in action first?

I created a demo at the [Service Worker Rails
Sandbox](https://serviceworker-rails.herokuapp.com/push-simple/) to show how a
simple push message would look like. Try it out in Firefox or Chrome or check
out the [source code on
GitHub](https://github.com/rossta/serviceworker-rails-sandbox).

![](screenshot/screenshot-sw-sandbox-push-simple.png)

Mozilla also has a lot more demos at the [Service Worker
Cookbook](https://serviceworke.rs/).

## Bird's eye view

Delivering push notifications involve interactions among three parties - the
user (through her browser), your Rails application, and the Web Push server,
which for our purposes is either Google or Firefox.

![](blog/push-notification-high-level.png)
> Diagram courtesy of the [Firefox wiki](https://wiki.mozilla.org/Firefox/Push_Notifications)

1. We'll use JavaScript on the user's current page to [register a service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) subscribe to push notifications via the [`pushManager`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe) interface. The browser will make a request to the Web Push server to a [`PushSubscription`](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription) which will contain a unique endpoint to the Web Push server and authorization keys required for encrypting the push notification request body.

1. We'll post the subscription info to our Rails app to be persisted on the server side.

1. To send a push notification, we'll use the [`webpush`](https://github.com/zaru/webpush) Ruby gem triggered from our Rails app. `webpush` is responsible for sending a proper request to the Web Push server, including [encryption of the message payload](https://developers.google.com/web/updates/2016/03/web-push-encryption?hl=en) for delivery.

1. If the request is successful, the Web Push server opens a socket to our
   registered service worker which can listen for `'push'` events to show a
notification to the user. Since service workers have a lifecycle independent of
the web page, they can process events even when the user is not visiting our
website.

## Setup

At the time of this writing, we'll need to configure our app to use the Google Cloud Messaging platform by registering for application keys. No special authorization is needed to use the Firefox push server as far as I can tell.

Google provides some decent [instructions for registering your app for push
notifications](https://developers.google.com/web/fundamentals/getting-started/push-notifications/step-04?hl=en) which involves some clicking around on the [Google developer console](https://console.developers.google.com). (I've heard rumors this may not be necessary in the near future.) You'll want to come away with a project id for your app and an API key to make authorized requests to the push server.

Both Firefox and Chrome will expect us to link to a `manifest` json file to
provide metadata for push subscriptions and notifications. Here's an example:

```json
{
  "name": "Your app name",
  "short_name": "Your app",
  "icons": [{
    "src": "images/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png"
  }],
  "start_url": "/",
  "display": "standalone",
  "gcm_sender_id": "<Your Project ID>",
  "gcm_user_visible_only": true
}
```

For now, this file can go in `public/manifest.json`. In your `app/views/layouts/application.html.erb` template, you'll also need to
add a special `<link>` tag to the manifest:

```html
<link rel="manifest" href="/manifest.json">
```

Here's the [actual manifest.json](https://serviceworker-rails.herokuapp.com/push-simple/manifest.json) for the Service Worker Rails Sandbox [push demo](https://serviceworker-rails.herokuapp.com/push-simple/) as another point of reference.

## Register a service worker

Yes, Service Worker time! In case you missed it, I'm really [excited about
Service Workers](/blog/series/service-worker.html). Service Workers have the
potential to level the playing field of reliability between the web and mobile devices.

Service workers come with special functionality and must also be deployed a bit differently than typical bundled JavaScript that's requested as part of the web page context. I've gone into more detail on how to [integrate Service Worker with Rails](/blog/service-worker-on-rails.html) previously.

Here's the quick setup for push. In `application.js` (or another `.js` required
by `application.js`) we'll use this following snippet to request registration of
a service worker script.

```javascript
# app/assets/javascripts/application.js
if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported');
  navigator.serviceWorker.register('/serviceworker.js')
    .then(function(reg) {
      console.log(':^)', reg);
      reg.pushManager.subscribe({ userVisibleOnly: true })
        .then(function(subscription) {
            console.log('endpoint:', sub.endpoint);
        });
  }).catch(function(error) {
    console.log(':^(', error);
  });
}
```

This code registers a service worker on the given scope via `navigator.serviceWorker.register`. This returns a [Promise]() which will resolve to an instance of `ServiceWorkerRegistration`. This registration object has a `pushManager` property which we use to `subscribe` to the Web Push server. The `{ userVisibleOnly: true }` parameter is required for us to use notifications.

In a separate file, `app/assets/javascripts/serviceworker.js`, we'll have our service worker show notifications when the `'push'` event is received:

```javascript
function onPush(event) {
  var title = (event.data && event.data.text()) || "Yay a message";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: "We have received a push message";,
      icon: "/assets/path/to/icon.png",
      tag:  "push-simple-demo-notification-tag"
    });
  )
}

self.addEventListener("push", onPush);
```

Because `serviceworker.js` needs to be a separate script available on the root
path, we either need to copy it to our `public/` directory , or, even better, we
can use the [`serviceworker-rails` (Star it on GitHub!)](https://github.com/rossta/serviceworker-rails) gem which will allow us to make use of both the asset pipeline and custom routing features we need.

```ruby
# Gemfile

gem 'serviceworker-rails'
```

To routes requests from `/serviceworker.js` to our JavaScript file in the asset pipeline, we'll configure the service worker rails middleware as follows:

```ruby
# config/initializers/serviceworker.rb
Rails.application.configure do
  config.serviceworker.routes do
    match "serviceworker.js"
  end
end
```

With these settings, we should be able to see our service worker register with the logging we put in place and be able to accept the browser prompt to receive notifications

## Persist the subscription

Let's set up a controller action to serialize the subscription into the visitor's session though any persistence method that will allow us to retrieve the subscription(s) for a given user will do.

The push subscription has important pieces of data: the endpoint and a set of keys: p256dh and auth. We need use this data in requests from our rails app to the push server.

```javascript
subscription.toJSON();
> {
    endpoint: "https://android.googleapis.com/gcm/send/a-subscription-id",
    keys: {
      auth: "16ByteString",
      p256dh: "65ByteString"
    }
  }
```

When our visitor subscribes, we can post the subscription to our Rails app:

```javascript
reg.pushManager.subscribe({ userVisibleOnly: true })
  .then(function(subscription) {
    $.post("/subscribe", { subscription: subscription.toJSON() });
  });

```

The route:

```ruby
# config/routes.rb

post "/subscribe" => "subscriptions#create"
```

Our controller - of course, greatly simplified for the purposes of the this demo:

```ruby
# app/controllers/subscriptions_controller.rb

class SubscriptionsController < ApplicationController
  def create
    session[:subscription] = JSON.dump(params.fetch(:subscription, {}))

    head :ok
  end
end
```

## Push it

Now that we have a subscription, we can send a push notification. For this, we'll use the `webpush` gem:

```ruby
# Gemfile

gem "webpush"
```

With the subscription info, we have what we need to send a message to a specific
user that will get encrypted in passing over the wire:

```ruby
Webpush.payload_send(
  message: "Hello World!",
  endpoint: "https://android.googleapis.com/gcm/send/a-subscription-id",
  auth: "16ByteString",
  p256dh: "65ByteString"
  api_key: "google_apik_key" # omit for Firefox, required for Google
)
```

## Troubleshooting

The `pushmanage.subscribe` request can fail if you haven't properly configured
your `manifest.json` with a valid Google Cloud Message sender id.
