---
title: ServiceWorker::Rails
author: Ross Kaffenberger
summary: Turn your Rails app into a Progressive Web App
description: Turn your Rails app into a Progressive Web App. Use Service Worker with the Rails asset pipeline.
thumbnail: 'screenshots/screenshot-serviceworker-rails.png'
published: true
homepage: 'https://rossta.net/'
links:
  'Source code on GitHub': 'https://github.com/rossta/serviceworker-rails'
  'Demo app': 'https://serviceworker-rails.herokuapp.com/'
tags:
  - Code
  - Ruby
  - Rails
tech:
  - ruby
---

The Rails asset pipeline makes a number of assumptions about what's best for deploying JavaScript, including asset digest fingerprints and long-lived cache headers - mostly to increase "cacheability". Rails also assumes a single parent directory, `/public/assets`, to make it easier to look up the file path for a given asset.

We want Sprockets to compile service worker JavaScript from ES6/7, CoffeeScript, ERB, etc. but must remove the caching and scoping mechanisms offered by Rails asset pipeline defaults. This is where `serviceworker-rails` comes in.

*Check out the [blog post](https://rossta.net/blog/service-worker-on-rails.html)
for more background.*

![Service Worker Rails
Sandbox](screenshots/screenshot-serviceworker-rails.png)
