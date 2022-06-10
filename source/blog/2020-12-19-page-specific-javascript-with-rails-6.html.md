---
title: Page specific JavaScript with Rails 6
author: Ross Kaffenberger
published: false
summary: Page Specific JavaScript with Rails 6 and Webpacker
description: Page Specific JavaScript with Rails 6
thumbnail: 'blog/stock/louvre-pexels-photo.jpg'
thumbnail_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

It's time for new rules when it comes to page specific JavaScript with Rails 6 and Webpacker.

Webpack's not-so-secret superpower is its ability to split up your code for you. Most Rails apps are not taking advantage though.

If you take away anything from this post, it is to learn dynamic imports and the "split chunks" webpack optimization before implementing page specific JavaScript in your Webpacker-based Rails apps.

To get page specific JavaScript with the old Rails asset pipeline, you would generally use a strategy I like to call "slice and dice":

A. Slicing up `'application.js'` by controller or capability into separate bundles ("Slice"), and/or

B. Using CSS selectors to selectively trigger JavaScript functions on page load ("Dice").`

There are a number of posts out there that capture various techniques slicing and dicing with Sprockets and the old Rails Asset Pipeline.

Techniques:

* Use "controller-specific" `javascript_include_tag` [the Rails guide for the Asset Pipeline](https://guides.rubyonrails.org/asset_pipeline.html#controller-specific-assets) describes .
* Use a naming convention so you don't forget to "precompile": https://blog.seancarpenter.net/2012/11/05/page-specific-javascript-with-the-asset-pipeline/
* Use a naming convention and check if the file exists before rendering: https://stackoverflow.com/a/12903463/771838
* Use a file directory convention to bundle subsets of JavaScript https://thoughtbot.com/blog/slicing-up-rails-application-js-for-faster-load-times#leverage-require_directory-in-manifests

You can find posts describing techniques for what I call "Dicing" that essentially all boil down to the same idea: conditionally run JavaScript based on the presence of a given DOM node.

* https://blog.seancarpenter.net/2012/11/05/page-specific-javascript-with-the-asset-pipeline/
* https://www.viget.com/articles/extending-paul-irishs-comprehensive-dom-ready-execution/


With Webpacker and Rails, it's time to revisit this strategy to page specific JavaScript.

At best, naively applying this approach under-utilizes webpack's capabilities and, at worst, it can unnecessarily bloat page weight.

In a previous post, I described [a number of well-known Webpacker-based Rails applications that are "overpacking"](/blog/rails-apps-overpacking-with-webpacker.html). In an effort to optimize and split up their Webpacker "packs", they're inadvertently increasing resulting overall payload size, increasing latency in the browser on page load. (I imagine, as well, their build times are longer than they should be).

### Recommendations

#### Phase 1: Put everything in one pack

When your application is just getting started, put everything in the `'application.js'` pack.

Seriously. Do not split your pack up into smaller bundles with Webpacker. You will make page load performance worse. You might introduce bugs.

This is doubly true if you're just starting out with Webpacker. There's already enough of a learning curve to modular JavaScript that you probably don't want to introduce extra variables.

This will most definitely be the easiest approach to understand. For a small application, it may well be worth having an application that's easier to maintain and outweigh the added cost of learning how to best to split up your JS code with webpack with modest performance gain.

#### Phase 2: Use Dynamic Imports to Lazy Load JavaScript modules

It's time to learn webpack's superpower: dynamic imports.

A static import looks like this
```javascript
import moment from 'moment'
```
In the example above, the imported module is a default export. Named exports can be desctructured.
```javascript
import { format } from 'date-fns'
```
Static imports cannot be conditionally loaded, but a dynamic import can:

* They are hoisted

Use dynamic imports to lazy load your page-specific code. In this scenario, you would still place all your JavaScript within the application.js dependency graph, but not all of this code would be loaded up-front. Webpack recognizes the dynamic import() function when it compiles your JS and will split the imported chunk out into a separate file that can be loaded on-demand in the browser using a JS framework router or a simple trigger.

For example, you could have code that looks like this:

if (document.querySelectorAll(".post-index").length) {
  import("./post/index") // webpack will load this JS async
}

Use page-specific "packs" combined with the splitChunks configuration API. In this scenario, instead of using an application.js pack, you would construct one for each page you want to treat differently, e.g, posts.js, admin.js etc. Using the splitChunks plugin means that your bundles can properly share code. I highly recommend treading carefully with this approach until you understand how Webpack works OR be willing to go through the process of learning Webpack in choosing this path. Webpack typically works best on the assumption you use only one entry point per page, otherwise, you may end up duplicate code across bundles unless you know what you're doing.
