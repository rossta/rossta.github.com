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

Service Worker is well-suited to enhance a simple website like this blog. The [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) has been designed in such as a way that developers can pick and choose the features they want without completing reworking their sites or committing to a (or another) JavaScript framework.

I recently added Service Worker enhancement to https://rossta.net. You can read
the [full source of my serviceworker.js implementation](https://github.com/rossta/rossta.github.com/blob/efbb4d41697a64543f5d4870c9915e633dda962d/source/assets/javascripts/serviceworker.js) at the time of this writing. I'll describe how I'm using Service Worker to:

1. Render an offline page when a visitor can't connect to rossta.net
2. Render HTML from the network with fallback to the local cache when offline
3. Render JavaScript and CSS assets immediately from cache while updating the
   cache from the network when possible
4. Clean up old cache when activating an update to the Service Worker

### Requirements

To get my first service worker running, I did the following:

__HTTPS everywhere__ I moved rossta.net to ["HTTPS everywhere"](https://en.wikipedia.org/wiki/HTTPS_Everywhere) with [Cloudflare](https://www.cloudflare.com/). Service workers will only run on sites served over HTTPS (or `localhost` for development). If you're considering Cloudflare for SSL, [be aware of the drawbacks](https://scotthelme.co.uk/tls-conundrum-and-leaving-cloudflare/).

__Registration__ Though the Service Worker runs in its own thread outside the context of a webpage, we need to initiate its use from the webpage we're on. So when you hit a page on https://rossta.net, there's a snippet of JavaScript that checks for browser support and registers a service worker script for the root scope of the website.

```javascript
// index.js
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js', {
    scope: '/'
  });
}
```

__Service Worker Script__ The service worker script can be as simple or as
complicated as is desired. After starting with the requisite "Hello World" in
`console.log` from `serviceworker.js`, I added in the functionality.
