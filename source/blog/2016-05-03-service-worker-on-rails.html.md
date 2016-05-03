---
title: Service Worker on Rails
author: Ross Kaffenberger
published: false
summary: Integrating Service Worker with the Rails asset pipeline
description: This blog post describes how to integerate JavasScript for the new Service Worker API into Ruby and Rails applications that uuse Sprockets for the Rails asset pipeline.
pull_image: 'blog/stock/blue-buildings-pexels-photo.jpeg'
series: Service Worker
category: Code
tags:
  - Rails
  - JavaScript
---

Have you heard about [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)? I believe this new JavaScript API has the potential to transform the way users interact with the web and how web developers construct websites. Though still in development, Service Worker is already [landing in modern browsers](https://jakearchibald.github.io/isserviceworkerready/).

What is it? In its plainest form, it's just JavaScript running in a separate thread outside the context of a web page, like any other [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

Service workers are special because they are **client-side proxies**. This means they can *hook into the request/response cycle* on the user's machine.

When we have the ability to hook in to the request/response cycle on the client-side, it means we have the ability to improve the user experience. Perhaps we can render html from a local cache while waiting for a response from the network or we could display another friendly page altogether when the network is offline.

For example, now that you've visited my site, your browser has cached the data for [my offline page](/offline.html), so if you lost your network connection, you'd at least see a friendly message instead of the dreaded Chrome dinosaur. So instead of the dreaded Chrome dinosaur, you'll see my offline page.

Go ahead and take a look at the [source code for the rossta.net service worker](https://github.com/rossta/rossta.github.com/blob/45b67d326bb1118c9e0743ae74e1a5ca570a5947/source/assets/javascripts/serviceworker.js) to see how I did it. I'm still learning about Service Worker - is it *really* new after all - so I'm sure there's lots of ways I could improve it!
