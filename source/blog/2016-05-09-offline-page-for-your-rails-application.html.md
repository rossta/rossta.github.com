---
title: An offline page for your Rails application
author: Ross Kaffenberger
published: true
summary: Use Service Worker to connect with your users even when they're not
description: This post demonstrates how to integrate the Service Worker Javascript API with the Rails asset pipeline to precache and render an offline page for your Rails application when visitors have no network connection.
pull_image: 'screenshots/screenshot-offline-chrome.jpg'
series: Service Worker
category: Code
tags:
  - Rails
---

When you visit a website without an internet connection in Chrome, you see the
offline dinosaur.

No wonder we tend to think of websites as less reliable than mobile applications - we can't use them without the network.

At least, not typically. We could use [App Cache](http://diveintohtml5.info/offline.html) and the Cache Manifest to create an offline experience. For [a number of reasons](http://alistapart.com/article/application-cache-is-a-douchebag), developers have found App Cache difficult to work with.

Luckily, there's a new web standard, [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), that potentially supplants App Cache by providing more granular control over networking in JavaScript, as opposed to manifest files.

For now, we use a service worker to render a simple error page with our own branding
when a user attempts to come back to our site without a connection. Keep in
mind, the techniques used here are building blocks that can be taken further to enhance functionality.

<aside class="callout panel">
  <p>
Sidebar: I've wondered: should the offline response be associated with an HTTP status code? I don't believe one exists for "No network connection". If the potential for service workers is fully realized, then in theory, web developers will be able to create rich experiences for users regardless of connectivity - so perhaps question won't be relevant. But our use case for a singular offline response - one in which we give visitors feedback about why their request cannot be fulfilled - correlates with statuses like "Not found", "Moved permanently", and "Site offline for maintenance". Philosophically, is a request that never reaches the server a request at all?
</p>
</aside>

To do this, we're going to use a service worker to precache the offline
assets on the first visit to the site. Later, during a return visit without a
network connection, we can use our service worker to render the offline page.

This is possible because Service Worker acts as a liason between your
visitor's browser and your servers *outside the lifecycle of a page*.

Keep in mind also, will be a *progressive enhancement*. Since service workers are [not available in all browsers](https://jakearchibald.github.io/isserviceworkerready/), this approach won't work for everyone, but the experience won't degrade for those visitors either.

### Produce the assets

First we need an offline page. We could simply use an HTML page in the public directory with embedded styles like the generated Rails 404 and 500 pages.

[Source: /offline.html](https://gist.github.com/rossta/c4f6de214a138a355a9993c7cdadbdc0)

Alternatively, set up a route to a controller action as a [dynamic Rails error page](https://mattbrictson.com/dynamic-rails-error-pages).

### Add a service worker file

We're going to cache this offline HTML on the client side during their first
visit so that it's available later. We can of course add links
to external CSS, JavaScript, and images in our offline pages - we just need to
remember to cache those resources as well.

(The following assumes Sprockets, so if using something else, we'll need to adjust accordingly where the asset pipeline is concerned.)

The service worker script file must live outside our `application.js` or other
bundled assets. It can live in any path from which Sprockets can load assets,
but for now, we'll add a new JavaScript file in `app/assets/javascripts/serviceworker.js`.

Since it won't be bundled with `application.js`, we'll need to let our Rails
configuration know to precompile our serviceworker separately:

```ruby
# config/initializers/assets.rb

Rails.application.config.assets.precompile += %w[serviceworker.js]
```

### Declare an 'install' event

Since service workers are event driven, we'll provide callbacks to three key events in the servive worker lifecycle: `install`, `activate`, and `fetch`.

The `install` event will be invoked just the first time the service worker is
requested or any time it is updated and redeployed prior to being activated. Here, we'll precache our offline assets:

```ruby
var version = 'v1::';

self.addEventListener('install', function onInstall(event) {
  event.waitUntil(
    caches.open(version + 'offline').then(function prefill(cache) {
      return cache.addAll([
        '/offline.html',
        // etc
      ]);
    })
  );
});
```

`event.waitUntil` accepts [a promise](http://www.html5rocks.com/en/tutorials/es6/promises/) which must succeed for the `install` event to install the service worker successfully. We use `caches.open` to return a promise that adds our static offline assets to a named cache associated with our site and the user's browser. The [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) provides client-side storage for request/response pairs, a lot like a built in HTTP cache.

We can also cache precompiled assets by renaming our `serviceworker.js` to `serviceworker.js.erb` and embedding helper methods:

```javascript
return cache.addAll([
  '/offline.html',
  '<%= asset_path "application.css" %>',
]);
```

### 'fetch' or fallback

Our service worker can intercept any external network request from our visitor's
browser - even to cross-origin hosts - within the fetch event.

There are [a ton of strategies we can
employ](https://jakearchibald.com/2014/offline-cookbook/) to give the service
worker power to respond to various requests, for our simple offline page

```javascript
self.addEventListener('fetch', function onFetch(event) {
  var request = event.request;

  if (!request.url.match(/^https?:\/\/example.com/) ) { return; }
  if (request.method !== 'GET') { return; }

  event.respondWith(
    fetch(request).                                      // first, the network
      .catch(function fallback() {
        caches.match(request).then(function(response) {  // then, the cache
          response || caches.match("/offline.html");     // then, /offline cache
        })
      })
  );
});
```

This code will filter for GET requests to our host. Ignored `fetch` events will simply proceed to the network. When we may want to provide the offline fallback, we'll then ask then network to `fetch` the
request. If that doesn't resolve, our `catch` handler will be invoked and
attempt to match the request in the cache or simply return our cached offline
page.

### Clean up during 'activate'

The `activate` event is useful to clean up old caches, say when the offline page
or any of the linked static resources changes.

```javascript
// var version = "v2::";

self.addEventListener('activate', function onActivate(event) {
  event.waitUntil(
    caches.keys().then(function deleteOldCache(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return key.indexOf(version) !== 0;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
```

If we deploy a service worker with a new version number, the `install` event
will be invoked again to re-cache the static resources for the offline page.
During `activate`, any cache names that don't match the new version number will
be removed.

### Register that worker

With our service worker event handling in place, we must register the script
from the main page. In any file included in `application.js`:

```javascript
// app/assets/application.js

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js');
}
```

It's important for this script to be available at the scope for which we want
the service worker to be active. In other words, registering the service worker
at its precompiled path `/assets/serviceworker.js`, won't be helpful since we
won't be able to intercept requests to the root path.

### Sprinkle in some middleware

To make this work with the Rails asset pipeline, we can use the
[`serviceworker-rails`](https://github.com/rossta/serviceworker-rails) gem.

```ruby
# Gemfile

gem "serviceworker-rails"
```

`ServiceWorker::Rails` will insert middleware into the Rails stack that we can
configure to route requests to bundled assets.

```ruby
# config/initializers/serviceworker.rb

Rails.application.configure do
  config.serviceworker.routes.draw do
    match "/serviceworker.js"
  end
end
```
Now, any request to the path `/serviceworker.js` will match an asset of that
name. If your service worker script is in a nested directory, you'd use this
instead:

```ruby
match "/serviceworker.js" => "nested/directory/serviceworker.js"
```

See the project [README](https://github.com/rossta/serviceworker-rails/blob/master/README.md) for more info on how to configure the middleware.

While you're at it, [star the project on GitHub](https://github.com/rossta/serviceworker-rails)!

### Moment of truth

Phew! That took some setup. Our offline page should now be ready for consumption. Try disabling your
network connection to test it out. You can use the *Network* tab in Chrome and
Chrome Canary to take your browser offline while Firefox has the *Work Offline* mode under the File menu.

![](screenshots/screenshot-dev-tools-network-offline.jpg)

To see a working demo of an offline page, check out the [Service Worker Rails
Sandbox app](https://serviceworker-rails.herokuapp.com/offline-fallback/). You
can find its [source code on GitHub](https://github.com/rossta/serviceworker-rails-sandbox).

![](screenshots/screenshot-offline-custom.jpg)

### Debugging

Chrome also provides some useful debugging tools for service workers under the
*Resources*. It's helpful to read up on the Service Worker life cycle since it is treated
differently than other JavaScript resources. For example, a hard refresh isn't
enough to get your browser to install an updated service worker -- the browser
will keep the current worker active while any tab to your browser is currently
open.

You can navigate to a different host and back or close and reopen
the tab(s). The `self.skipWaiting` function will also instruct the browser to
let a new service worker take control immediately when used during `install`.

```javascript
self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});
```

### Final word

I believe it's important for web developers to start thinking about ways to make
our application more reliable in the eyes of consumers. While rendering an
offline page isn't a game changer by itself, it is a low-risk way to begin
experimenting with the Service Worker API which has the potential for [many more
advanced use cases](http://serviceworke.rs/) and can help the web get
closer to an even playing field with mobile apps.
