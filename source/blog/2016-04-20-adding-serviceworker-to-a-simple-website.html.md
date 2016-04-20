---
title: Adding Service Worker to a Simple Website
author: Ross Kaffenberger
published: false
summary: ''
description: ''
pull_image: 'blog/stock/cyclists-unsplash-photo.jpg'
series: Service Worker
tags:
  - Code
  - JavaScript
---

Sorry, [progressive enhancement is not dead](http://tomdale.net/2013/09/progressive-enhancement-is-dead/). Given the excitement around the introduction of Service Workers to modern browsers, perhaps the perspective on progressive enhancement is shifting. We are seeing a rebirth of interest in using JavaScript to layer on user-experience improvements without ignoring "the rest".

Service Worker is well-suited to enhance a simple website like this blog. The [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) has been designed in such as a way that developers can pick and choose the features they want without completing reworking their sites or committing to a (or another) JavaScript framework.

I recently added Service Worker enhancement to https://rossta.net. You can read
the [full source of my serviceworker.js implementation](https://github.com/rossta/rossta.github.com/blob/00396de7c0d1b2b4c7adb47b377347e0c9a6fbe4/source/assets/javascripts/serviceworker.js) at the time of this writing. I'll describe how I'm using Service Worker to:

1. Render an offline page when a visitor can't connect to rossta.net
2. Render HTML from the network with fallback to the local cache when offline
3. Render JavaScript and CSS assets immediately from cache while updating the
   cache from the network when possible


