---
title: Offline page for your Rails application
author: Ross Kaffenberger
published: true
summary: Use Service Worker to connect with your users even when they're not
description: Offline page for your Rails application
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series: Service Worker
category: Code
tags:
  - Rails
---

When you visit a website without an internet connection in Chrome, you see the
offline dinosaur:

![Nobody's Home](screenshots/screenshot-offline-chrome.jpg)

No wonder we tend to think of websites as less reliable than mobile applications - we can't use them without the network.

Let's take a look at how we might render an Offline page to our visitors, even when they've lost their network connection. Previously, we would have used [App Cache](http://diveintohtml5.info/offline.html) and the Cache Manifest. For [a number of reasons](http://alistapart.com/article/application-cache-is-a-douchebag), developers have found App Cache difficult to work with.

Luckily, there's a new web standard, [Service Worker], that can be used to create
offline experiences, among other things, using JavaScript instead of manifest
files.

For now, we'll just look at rendering a simple error page with our own branding
when a user attempts to come back to our site without a connection. Keep in
mind, the techniques used here can be taken further to provide additional functionality.

Here's our offline page.

<script src="https://gist.github.com/rossta/c4f6de214a138a355a9993c7cdadbdc0.js"></script>
