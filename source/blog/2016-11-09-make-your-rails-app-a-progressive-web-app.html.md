---
title: Make your Rails app a Progressive Web App
author: Ross Kaffenberger
published: true
summary: From the Rails Way to PWA in no time
description: This tutorial shows how to make Progressive Web App on Rails using the serviceworker-rails gem
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series: Service Worker
category: Code
tags:
  - Rails
  - JavaScript
---

Discussion around Progressive Web Apps is catching fire in the JavaScript
community. In the Rails community, not so much. Perhaps it's because Rails
culture "has had a problem" with JavaScript, as [Giles Bowkett recently pointed
out](http://gilesbowkett.blogspot.com/2016/10/let-asset-pipeline-die.html).

What are Progressive Web Apps? Simply put, they are web applications that deliver a mobile
app-like experience. Open web technologies are now making it possible to make browser-based web apps:

* installable - we can add them to the Home Screen of a mobile device easily
* more reliable - we can provide a user experience when the device is offline or
  network responsiveness has degraded, and can sync user requests in the
background when network capability is restored
* more engaging - we can notify users of activity even when they're not using the
  site

Technically, nothing about Rails is incongruent with Progressive Web App technology. Better yet, the choice to transition to PWA is completely orthogonal to whatever JavaScript MVC framework/module bundler/turbolinks decision you might be otherwise already tackling. In the coming years, I believe it will become increasingly important to adopt PWA features to keep up with demand as more and more site visits will shift to mobile web.

Rails hasn't been tuned in to take advantage of benefits of Progressive Web
Apps and I'll bet you might not be sure how to get started. Let's fix that.

## Your first Progressive Web App on Rails

Eric Elliot recently posted [a thorough overview of Progessive Web App
requirements](https://medium.com/javascript-scene/native-apps-are-doomed-ac397148a2c0)
that's worth a read. Here's summary of what's needed:

* HTTPS - any page that uses Progressive Web App technology needs to be served
  over SSL/TLS so "HTTPS everywhere" is recommended
* [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) - a
  text file with application metadata to support home screen installation
* [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - a client-side JavaScript worker that can intercept network requests, modify responses, interact with local caches, sync data in the background, and enable push notifications

### Set up HTTPS

To enable HTTPS on our website, we'll need to decide for ourselves how to set up our web
server depending on our hosting provider and deployment needs. Tutorials for setting up [Heroku](https://devcenter.heroku.com/articles/ssl) and [Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-install-an-ssl-certificate-from-a-commercial-certificate-authority) may be a good place to start.

We'll also want to force SSL settings in our Rails application
configuration for our remote environments, i.e., `production`.

```ruby
# config/environments/production.rb

Rails.application.configure do
  # ...

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # ...
end
```

We should be sure to test out this behavior on a secondary remote environment before going live in
production as we'll want to be aware of hiccups like mixed content warnings and
hard-coded non-HTTPS urls in our application.

### Add a manifest and Service Worker

For this next step, we'll assume we're using the Rails asset pipeline. This is
both helpful and presents a problem:

The Rails asset pipeline makes a number of assumptions about what's best for deploying JavaScript, including asset digest fingerprints and long-lived cache headers - mostly to increase "cacheability". Rails also assumes a single parent directory, /public/assets, to make it easier to look up the file path for a given asset.

Service worker and manifest assets must play by different rules. Service workers may only be active from within the scope from which they are served. So if you try to register a service worker from a Rails asset pipeline path, like `/assets/serviceworker-abcd1234.js`, it will only be able to interact with requests and responses within `/assets/**`. This is not what we want.

To address this issue, I created the `serviceworker-rails` gem ([source](https://github.com/rossta/serviceworker-rails)). This Rails
plugin makes it easier to set up your app to serve service worker
scripts and web app manifests at canonical urls while taking advantage of the transpilation and
interpolation features the asset pipeline provides.

To get started with `serviceworker-rails`, we'll bundle it with our Rails app.

Add the gem to the `Gemfile`:

```ruby
# Gemfile

gem "serviceworker-rails"
```

Bundle the app:

```bash
$ bundle
```

We'll use the built-in generator from service worker rails to add some starter
JavaScript files to our project and the proper configuration.

```bash
$ rails g serviceworker:install
```

The generator will create the following files:

* `config/initializers/serviceworker.rb` - for configuring your Rails app
* `app/assets/javascripts/serviceworker.js.erb` - a blank Service Worker
  script with some example strategies
* `app/assets/javascripts/serviceworker-companion.js` - a snippet of JavaScript
  necessary to register your Service Worker in the browser
* `app/assets/javascripts/manifest.json.erb` - a starter web app manifest
  pointing to some default app icons provided by the gem
* `public/offline.html` - a starter offline page

It will also make the following modifications to existing files:

* Adds a sprockets directive to `application.js` to require
  `serviceworker-companion.js`
* Adds `serviceworker.js` and `manifest.json` to the list of compiled assets in
  `config/initializers/assets.rb`
* Injects tags into the `head` of `app/views/layouts/application.html.erb` for
  linking to the web app manifest

Of course, we could do this set up manually, but it may be helpful to run the
automated install for our first attempt. If going manual, consult the `serviceworker-rails`
[README](https://github.com/rossta/serviceworker-rails) and my previous [blog
post on configuring the gem](https://rossta.net/blog/service-worker-on-rails.html) for more help during setup.

At this point, we've got all the boilerplate in place in our Rails app to begin
adding Progessive Web App functionality. The great part is, we can pick and
choose which features we want to add.

Here are few things you can try:

* [Adding an offline page for your Rails app](https://rossta.net/blog/offline-page-for-your-rails-application.html)
* [Sending Web Push notifications from Rails](https://rossta.net/blog/web-push-notifications-from-rails.html)

## Going further

For more on grasping Service Worker fundamentals and developing offline solutions for the web, I highly recommend this free Udacity course:

* [Offline Web Applications](https://www.udacity.com/course/offline-web-applications--ud899) by Google

You'll want to understand the Service Worker life cycle, which Jake Archibald
treats in great detail:

* [The Service Worker Lifecycle](https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/lifecycle)

Of course, we've only covered the getting started part of our journey with
Progressive Web Apps. I've left out a lot of fun parts like decided how to implement
caching strategies or send push notifications. Here are some resources to check
out to take your PWA skills to the next level:

* [ServiceWorke.rs](https://serviceworke.rs/) - a set of Service Worker recipes
  and demos from Mozilla
* [Offline Cookbook](https://jakearchibald.com/2014/offline-cookbook/) - a great rundown of Service Worker snippets, including a number of caching strategies, by Jake Archibald
* [Service Worker on Rails Sandbox](https://github.com/rossta/serviceworker-rails-sandbox) - a demo Progressive Web App on Rails using the `serviceworker-rails` gem by [@rossta](https://github.com/rossta)
* [Awesome Progressive Web Apps](https://github.com/TalAter/awesome-progressive-web-apps) - kitchen sink of PWA resources
* [Awesome Service Workers](https://github.com/TalAter/awesome-service-workers) - kitchen sink of Service Worker resources
