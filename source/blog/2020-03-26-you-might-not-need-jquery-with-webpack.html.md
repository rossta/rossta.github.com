---
title: You might not need jQuery for your plugins
author: Ross Kaffenberger
published: false
summary: In Webpack, some dependencies are best served vanilla
description: Upgrading jQuery plugins to work with Webpack is a common source of confusion. This is especially true for Rails developers transitioning from Sprockets-based asset pipeline to a module bundler. If you find yourself in this position, make sure to understand the capability of the plugins you're using. If you're lucky, you may find they can work in either context such that you might not need jQuery at all.
pull_image: 'blog/stock/clint-patterson-exfrR9KkzlE-unsplash-resized.jpg'
pull_image_caption: Photo by Clint Patterson on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

Have you seen this console error while trying to adopt Webpack?

```javascript
$('.main-carousel').flickity({
  // options
  cellAlign: 'left',
  contain: true
});
```
```sh
Uncaught TypeError: $(...).flickity is not a function
```

Assuming you actually have imported the plugin to your build, there could be a few explanations. In this post, we'll look one possible reason: your plugin might not rely on jQuery in a module-based runtime like Webpack.

## From global to modular

Switching from a file-concatenation tool like Sprockets in the Rails asset pipeline to a proper module bundler like Webpack is a paradigm shift.

Prior to adoption of module formats, developers commonly rolled their own module patterns by hanging functionality off a global variable. In this setup, developers have must be careful to require files in the proper order to ensure required functions are available in a given context. Many Rails applications still work this way. jQuery plugins are simply a manifestation of this pattern.

With Webpack, unlike with the Rails asset pipeline, each source file is treated as a JavaScript module with its own scope. Access between modules must be explicit, e.g. `import $ from 'jquery';`. This model addresses the order-dependency concerns, as with the Rails asset\pipeline, and it also means it should no longer necessary to hang functionality off a global variable.


## Show and tell

To take advantage of this distinction, more plugins are being written without the assumption of jQuery as a dependency, but with the ability to use a plugin to support (what's becoming) the legacy pattern.

Here's an example. The popular jQuery plugin [Flickity](https://flickity.metafizzy.co/) makes it easy to construct "responsive, flickable carousels" as follows:

```javascript
$('.main-carousel').flickity({
  // options
  cellAlign: 'left',
  contain: true
});
```

And that works fine. Except, `Flickity` is not really a jQuery plugin. It's just packaged that way for the browser as with the pre-bundled distribution ([source](https://unpkg.com/flickity@2.2.1/dist/flickity.pkgd.js)).

In a runtime that supports modules, as with a Webpack-bundled application, the usage is instead ideally:

```javascript
// app/javascript/src/carousel.js

import Flickity from 'flickity';

const flickity = new Flickity( '.main-carousel', {
  // options
  cellAlign: 'left',
  contain: true
});
```

For this plugin, jQuery is not required. One hint Flickity works this way is that the [Node.js entry point to the package](https://github.com/metafizzy/flickity/blob/master/js/index.js) exports a module.

A similar approach can be used for other plugins including:

* [masonry](https://github.com/desandro/masonry)
* [infinite-scroll](https://github.com/metafizzy/infinite-scroll)
* [isotope](https://github.com/metafizzy/isotope)
* [draggabilly](https://github.com/desandro/draggabilly)

The examples above all happen to be popular plugins that use a build step to produce a modular-aware, "jQuery-fied" version of the underlying vanilla JS library. (For more details, see the [jquery-bridget](https://github.com/desandro/jquery-bridget) project).

This won't work for all jQuery plugins because in so many different flavors. Some plugins have been packaged with awareness of popular module formats, like CommonJS or Asynchronous Module Definition (AMD) and some have not. It's best to first consult the documentation of your plugins to see if it's possible to use without jQuery as you make the Webpack upgrade.

## Conclusion

Upgrading jQuery plugins to work with Webpack is a common source of confusion. This is especially true for Rails developers transitioning from Sprockets-based asset pipeline to a module bundler. If you find yourself in this position, make sure to understand the capability of the plugins you're using. Ask "do I have to use this plugin with jQuery?" If you're lucky, you may find they can work in either context such that you might not need jQuery at all.
