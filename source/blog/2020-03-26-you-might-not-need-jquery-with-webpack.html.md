---
title: jQuery plugins in webpack without jQuery
author: Ross Kaffenberger
published: true
summary: In webpack, some dependencies are best served vanilla
description: Upgrading jQuery plugins to work with webpack is a common source of confusion. If you're lucky, you may find they can work in either context such that you might not need jQuery at all.
thumbnail: 'blog/stock/clint-patterson-exfrR9KkzlE-unsplash-resized.jpg'
thumbnail_caption: Photo by Clint Patterson on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
type: WTF
---

Have you seen this console error while trying to adopt webpack?

```sh
Uncaught TypeError: $(...).myJqueryPlugin is not a function
```

Assuming you installed it correctly, there could be a few explanations. In this post, we'll look one possible reason: with webpack, your jQuery plugin _might_ not need jQuery.

> [Subscribe to my newsletter](https://buttondown.email/joyofrails), Joy of Rails, to get notified about new content.

### Example: the Flickity plugin

To take advantage of this distinction, more plugins are being written without the assumption of jQuery as a dependency, but with the ability to use a plugin to support (what's becoming) the legacy pattern.

Here's an example. The popular jQuery plugin [Flickity](https://flickity.metafizzy.co/) makes it easy to construct "responsive, flickable carousels" as follows:

```javascript
$('.main-carousel').flickity({
  // options
  cellAlign: 'left',
  contain: true,
})
```

And that works fine. Except, `Flickity` is not really a just a jQuery plugin. More on that later.

Let's say we have a Rails application that we've already set up to run webpack(er) (or just plain webpack) for compiling JavaScript source files for the browser. To add Flickity, we installed it via yarn:

```sh
$ yarn add flickity
```

In our module-based webpack build, the usage is instead ideally:

```javascript
// app/javascript/src/carousel.js

import Flickity from 'flickity'

const flickity = new Flickity('.main-carousel', {
  // options
  cellAlign: 'left',
  contain: true,
})
```

For this plugin, jQuery is not required. How do we know that though?

### Package perusal

The first place to check is the documentation. As is the case for Flickty, there is a great documentation site with examples for both jQuery and vanilla JS initialization.

Here's a screenshot from the [Flickity homepage](https://flickity.metafizzy.co/):

![Flickity documentation example](blog/flickity-documentation-example.png)

This is a great hint that we can import the `Flickity` constructor without requiring jQuery on the page or in our build.

If that's still not enough, the next place to look is the library's [package.json `main` property](https://nodesource.com/blog/the-basics-of-package-json-in-node-js-and-npm/#themainproperty). This property describes the _entry point_ to the package, meaning this is the file that's loaded when `require` or `import` statement is used to access the module.

Here's an excerpt from Flickity's `package.json`:

```json
{
  "name": "flickity",
  "main": "js/index.js"
  // ...
}
```

This is saying thath the file `path/to/flickity/js/index.js` is the entry point. On my machine from the root of my project, I can open that file at `./node_modules/flickity/js/index.js` or on GitHub ([source](https://github.com/metafizzy/flickity/blob/c67b28accbe0642352c706cb470a8f607fa5861b/js/index.js)) (slightly modified for this article).

```
( function( window, factory ) {
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [ './flickity', './drag', './prev-next-button', './page-dots', './player', './add-remove-cell', './lazyload' ], factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory( require('./flickity'), require('./drag'), require('./prev-next-button'), require('./page-dots'), require('./player'), require('./add-remove-cell'), require('./lazyload'));
  }
})( window, function factory( Flickity ) {
  return Flickity;
});
```

We can see this exports a module, either through the `define` function, for runtimes that support [Asynchronous Module Definition (AMD)](https://requirejs.org/docs/whyamd.html) format, or the `require` function, for runtimes that support [CommonJS](https://nodejs.org/docs/latest/api/modules.html) format. webpack supports both.

### jQuery not required

Note also that this file does not require the `'jquery'` package. An interesting consequence of this is that it's not even possible to use Flickity with jQuery (at least via the NPM package alone). This recently came up in a [GitHub issue for the Webpacker project](https://github.com/rails/webpacker/issues/2456).

In other words, the following code with webpack:

```javascript
// app/javascript/src/carousel.js
import 'jquery'
import 'flickity'

$('.main-carousel').flickity({
  // options
  cellAlign: 'left',
  contain: true,
})
```

would result in this error:

```sh
Uncaught TypeError: $(...).flickity is not a function
```

This project can produce a separate distribution from the package available via NPM. It takes the form of a file, here called [`flickity.pkgd.js`](https://github.com/metafizzy/flickity/blob/c67b28accbe0642352c706cb470a8f607fa5861b/dist/flickity.pkgd.js) that is intended for the browser via a script tag. This file contains a "jQuery-fied" version of the underlying vanilla JS constructor which makes it possible to use with jQuery in the browser. For more details, see the [jquery-bridget](https://github.com/desandro/jquery-bridget) project.

A similar approach exists in other plugins including:

- [masonry](https://github.com/desandro/masonry)
- [infinite-scroll](https://github.com/metafizzy/infinite-scroll)
- [isotope](https://github.com/metafizzy/isotope)
- [draggabilly](https://github.com/desandro/draggabilly)

The main takeaway here: if the library can be initialized without jQuery, there's not much reason to use jQuery for that plugin in the first place.

### Conclusion

Unfortunately, jQuery plugins come in so many different flavors so not all of them can be used _without_ jQuery. In future posts, I'll discuss other techniques you can use to make jQuery work with webpack.

If you find yourself in this position, make sure to understand the capability of the plugins you're using. Ask "do I have to use this plugin with jQuery?", consult the documentation and/or browse the source code as described in the article. If you're lucky, you may find they can work in either context such that you might not need jQuery at all.
