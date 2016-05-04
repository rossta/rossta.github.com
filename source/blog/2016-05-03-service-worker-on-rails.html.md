---
title: Service Worker on Rails
author: Ross Kaffenberger
published: true
summary: Integrating Service Worker with the Rails asset pipeline
description: This blog post describes how to integerate JavasScript for the new Service Worker API into Ruby and Rails applications that uuse Sprockets for the Rails asset pipeline.
pull_image: 'blog/stock/blue-buildings-pexels-photo.jpeg'
series: Service Worker
category: Code
tags:
- Rails
- JavaScript
---

Have you heard about [Service
Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)? I
believe this new JavaScript API has the potential to transform the way users
interact with the web and how web developers construct websites. Though still in
development, Service Worker is already [landing in modern
browsers](https://jakearchibald.github.io/isserviceworkerready/).

So far, there hasn't been a good story for adding Service Worker to Rails. Until
now!

There's a new Ruby gem, [`serviceworker-rails`](https://github.com/rossta/serviceworker-rails), to make it easier to integrate Service Worker with the Rails asset pipeline. To understand why Rails developers might want to use this, let's take a step back.

## A brief intro

In its plainest form, service workers are just JavaScript running in a separate thread outside the context of a web page, like any other [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

Service workers are special because they are **client-side proxies**. This means they can *hook into the request/response cycle* on the user's machine.

When we have the ability to hook in to the request/response cycle on the client-side, it means we have the ability to improve the user experience. Perhaps we can render html from a local cache while waiting for a response from the network or we could display another friendly page altogether when the network is offline.

For example, now that you've visited my site, your browser has cached the data for [my offline page](/offline.html), so if you lost your network connection, you'd at least see a friendly message instead of the dreaded Chrome dinosaur. So instead of the dreaded Chrome dinosaur, you'll see my offline page.

Go ahead and take a look at the [source code for the rossta.net service worker](https://github.com/rossta/rossta.github.com/blob/45b67d326bb1118c9e0743ae74e1a5ca570a5947/source/assets/javascripts/serviceworker.js) to see how I did it. I'm still learning about Service Worker - is it *really* new after all - so I'm sure there's lots of ways I could improve it!

## Let's talk Rails

So after using one on a [simple static website](/blog/adding-serviceworker-to-a-simple-website.html), I wanted to figure out how I'd add a service worker to a Rails application. I'd expect Rails developers would want to be able to develop and deploy their service workers like any other JavaScript assets using the Rails asset pipeline. Not so fast though.

As it turns out, to use Service Workers on Rails, we want some, but not all, of the Rails asset pipeline.

The Rails asset pipeline makes a number of assumptions about what's best for deploying JavaScript, including asset digest fingerprints and long-lived cache headers - mostly to increase "cacheability". Rails also assumes a single parent directory, `public/assets`, to make it easier to look up the file path for a given asset.

Service worker assets must play by different rules. Consider these behaviors:

* Service workers may only be active from within the scope from which they are
served. So if you try to register a service worker from a Rails asset pipeline
path, like `/assets/serviceworker-abcd1234.js`, it will only be able to interact
with requests and responses within `/assets/`<em>**</em>. This is not what we want.
* MDN states browsers check for updated service worker scripts in the background
every 24 hours (possibly less). Rails developers wouldn't be able to take
advantage of this feature since the fingerprint strategy means assets at a given
url are immutable. Beside fingerprintings, the `Cache-Control` headers used for
static files served from Rails also work against browser's treatment of service
workers.

<em>**</em>[There is an early proposal](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/#service-worker-allowed) to use the `Service-Worker-Allowed` header to change scopes.

## What to do?

So, Rails developers need to work around best practices in the Rails asset pipeline to use service workers.

One approach would be to just place service worker scripts in `/public`. That
could work, but it could mean foregoing the asset pipeline altogether. We lose
bundling, transpilation, testing and other features we do want. You could use
the pipeline but would then need to add steps to the build process to copy
precompiled service workers to the correct paths. In this case, you may want toaugment your
web server configuration to change `Cache-Control` headers for those selected service worker scripts - this may not be possible in certain environments.

Given the constraints around scoping, you could create
special controller actions to mount service workers at arbitrary routes. Rails
also gives you the ability to set custom headers on controller actions so that's
another benefit. From there, you either write your JavaScript in a template where you may lose the advantage of the asset pipeline or
expose the contents of a precompiled asset from within the controller.

I like this last option up until the point where a standard Rails controller
adds a lot of overhead, e.g. parameter parsing, session and cookie management, CSRF
protection, that isn't needed for serving static files. From there, you can drop
down to a `ActionController::Metal` subclass and figure out which extensions to
pull in... or put this in a Rack middleware!

## Using serviceworker-rails

This is what I've done with [`serviceworker-rails`](https://github.com/rossta/serviceworker-rails). It inserts a middleware into the Rails stack that acts as a separate router for service workers. It can be configured to proxy requests to arbitrary endpoints to precompiled Rails assets.

One the gem is added to your `Gemfile`, you can add a Rails initializer to set
up the service worker middleware router:

```ruby
# config/initializers/serviceworker.rb
Rails.application.configure do
  config.serviceworker.routes.draw do
    match "/serviceworker.js" => "path/to/precompiled/serviceworker"
  end
end
```

By default, the middleware sets the `Cache-Control` header to avoid aggressive caching. It also gives you the ability to customize headers as desired.

```ruby
match "/serviceworker.js" => "app/serviceworker", headers: { "X-Custom-Header" => "foobar" }
```

Use globbing or named parameters in the service worker paths to interpolate
asset names.

```ruby
match "/*segments/serviceworker.js" => "%{segments}/serviceworker"
match "/project/:id/serviceworker.js" => "project/%{id}/serviceworker"
```

Check out the project [README](https://github.com/rossta/serviceworker-rails#serviceworkerrails) for more info on how to set up and configure the middleware for your Rails app.

Though the project is still young, you can see `serviceworker-rails` in action in the [Service Workers on Rails Sandbox](https://serviceworker-rails.herokuapp.com/). Inspired by Mozilla's [Service Workers Cookbook](https://serviceworke.rs/), it serves as good place to experiment with Service Workers on Rails in a public setting. Try using the site in Chrome Canary with the [advanced service worker debugging tools](https://www.chromium.org/blink/serviceworker/service-worker-faq) to play around. I've added just a few examples so far but am interested to explore further with various caching strategies, push notifications, and eventually background sync to name a few.

Interested in contributing? [Fork the serviceworker-rails gem](https://github.com/rossta/serviceworker-rails) or the [Service Workers on Rails Sandbox](https://github.com/rossta/serviceworker-rails-sandbox) to get started.
