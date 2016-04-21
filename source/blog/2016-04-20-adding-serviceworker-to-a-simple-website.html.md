---
title: Adding Service Worker to a simple website
author: Ross Kaffenberger
published: true
summary: 'Where "simple" is a static website hosted on Github pages and
Cloudflare'
description: 'Described how I added a Service Worker script to rossta.net with
some considerations concerning cache-busting strategies and deployment'
pull_image: 'blog/stock/cyclists-unsplash-photo.jpg'
series: Service Worker
tags:
  - Code
  - JavaScript
---

Service Worker is well-suited to enhance a simple website like this blog. The [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) has been designed in such as a way that developers can pick and choose the features they want without reworking their sites or committing to a (or another) JavaScript framework.

I recently added a service worker to rossta.net. You can read
the [full source of my serviceworker.js implementation](https://github.com/rossta/rossta.github.com/blob/efbb4d41697a64543f5d4870c9915e633dda962d/source/assets/javascripts/serviceworker.js) here.

### Requirements

To get my first service worker running, I did the following:

__HTTPS everywhere__ I moved rossta.net to ["HTTPS everywhere"](https://en.wikipedia.org/wiki/HTTPS_Everywhere) with [Cloudflare](https://www.cloudflare.com/). Service workers will only run on sites served over HTTPS (or `localhost` for development). If you're considering Cloudflare for SSL, [be aware of the drawbacks](https://scotthelme.co.uk/tls-conundrum-and-leaving-cloudflare/).

__Registration__ Though the Service Worker runs in its own thread outside the context of a webpage, we need to initiate its use from the webpage we're on. So when you hit a page on rossta.net, there's a snippet of JavaScript that checks for browser support and registers a service worker script for the root scope of the website.

```javascript
// index.js
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js', {
    scope: '/'
  });
}
```

__Service Worker Script__ The service worker script gets deployed to https://rossta.net/serviceworker.js separately from
the concatenated, versioned JavaScript bundles used on the main site.

### The script

For the code in my first service worker script, I followed the strategy outlined by Jeremy Keith's excellent
[My first Service Worker](https://adactio.com/journal/9775). He also provided a
generalized version of his script in a [service worker gist](https://gist.github.com/adactio/fbaa3a5952774553f5e7) that's definitely worth a look.

Here's a general summary of the Service Worker's responsibilities at various stages in its life cycle:

On `install`:

* "Pre-cache" any desired resource, primarily for rendering in an offline context

On `activate`:

* Clean up old cache when activating an update to the Service Worker

On `fetch`:

* Render HTML from the network while adding it to the local cache for use when offline
* Render JavaScript and CSS assets immediately from cache while updating the cache from the network when possible
* Render an offline page when a visitor can't connect to rossta.net
* Allow normal pass-through network request of non-GET and white-listed resources like Twitter embeds and analytics tracking

### Deployment my service worker

Below I describe how I deployed my service worker, but your mileage may vary depending on your own production needs. [As I've said before](https://rossta.net/blog/why-i-ditched-wordpress-for-github.html), this is a static site hosted on Github pages, [built with Webpack and Middleman](/blog/using-webpack-with-middleman.html).

Setting up Github pages to use Cloudflare was relatively straightforward and has been [well-documented](https://www.benburwell.com/posts/configuring-cloudflare-universal-ssl/). I also wanted to make sure `serviceworker.js` is always served over HTTPS and that it would not be cached. Since I don't have any control on Github pages over related concerns like redirects and response headers. However, with Cloudflare, I set up Page Rules on Cloudflare to mitigate this issue.

To ensure content on rossta.net is always loaded over HTTPS, I added a redirect page rule:

![](blog/cloud-flare-page-rules-https.jpg)

I'm using Webpack to create [separate bundles](https://github.com/rossta/rossta.github.com/blob/09131d3adeb161747fa0cfc624db3ae12ab211fd/webpack.config.js#L12) and Middleman's [`:asset_hash` extension](https://middlemanapp.com/advanced/improving_cacheability/) to add a digest to each file, similar to the [Rails asset pipeline production behavior](http://guides.rubyonrails.org/asset_pipeline.html#in-production) to improve the cacheability of CSS and JavaScript assets on rossta.net.

I don't want either for serviceworker.js: it must be served separately from the main asset bundles and it should not be cached.

Webpack supports [multiple configurations](https://webpack.github.io/docs/configuration.html#multiple-configurations), so I set up my [`webpack.config.js`](https://github.com/rossta/rossta.github.com/blob/09131d3adeb161747fa0cfc624db3ae12ab211fd/webpack.config.js#L80) to use ES2015 transpilation for `serviceworker.js` but output to a different destination from the other concatenated script files.

To make sure Cloudflare does not cache `serviceworker.js`, as it would by default for the CDN, I instructed Cloudflare to bypass the cache.

![](blog/cloud-flare-page-rules-serviceworker.jpg)

Github pages currently adds 10-minute `Expires` and `Cache-Control` headers to resource requests meaning browsers and proxies may choose to cache `serviceworker.js` past an update I've just deployed. This is a tradeoff I'll have to live with until I move rossta.net to another host.

### Caching considerations

There are some key considerations regarding the browser cache when setting up your first service worker with
an approach like the one [Jeremy Keith](https://adactio.com/journal/9775) outlines and that I've used here in
rossta.net. Jeff Posnick, maintainer of Google Chrome's [sw-precache](https://github.com/GoogleChrome/sw-precache), highlights some of these points [in a recent comment](https://remysharp.com/2016/03/22/the-copy--paste-guide-to-your-first-service-worker).

> Any of the following would be safe, though they each have certain drawbacks:
> 1. Serving all of the local assets with browser caching disabled.
> 2. Cache-busting the requests that are used to populate the SW cache, using the non-cache-busted URL as the SW cache key.
> 3. Explicitly versioning all of your local assets using something like gulp-rev, and then using long-lived browser caching headers.
>
> Some drawbacks of each:
>
> Approach 1. Means that all requests, even those coming from browsers without SW support, will bypass the browser cache, and that's can be a lot of wasteful traffic.
>
> Approach 2. Can mean some extra code that makes the simple copy and paste example look a bit more complicated.
>
> Approach 3. Is a good practice to follow in general, but there's an extra build-time step that you need to introduce, and it only applies to subresources, not URLs used as navigation targets (you'd likely just have to serve those bypassing the browser cache completely).

Realize that the browser cache is separate from the local cache used by the
service worker. So, when caching resources in your service worker, you may need
to consider the "cache busting" strategy for both your service worker and the
browser and [how users may be affected when pushing updates to the site](https://github.com/GoogleChrome/css-triggers/issues/14).

If browser cache is disabled, then you can happily use your service worker to
cache resources without conflict, albeit, without the obvious benefits of a browser cache.

In other words, take a moment to consider how your assets may (or may not) be cached by
browsers before [copying and pasting your first service worker](https://remysharp.com/2016/03/22/the-copy--paste-guide-to-your-first-service-worker).

### Onward

There's a lot more that can be done with the Service Worker API, but this was a
good start to see some impressive perceived performance improvements, especially when
reloading pages with images and special fonts.
