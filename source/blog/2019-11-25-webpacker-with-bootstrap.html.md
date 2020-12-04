---
title: Using Bootstrap with Rails Webpacker
author: Ross Kaffenberger
published: true
summary: Bootstrap 4 is now more webpack-friendly
description: This time we'll walk through the steps for integrating Bootstrap 4 with Rails and Webpacker 4.
pull_image: 'blog/stock/roman-kraft-crafts-unsplash.jpg'
pull_image_caption: Photo by Roman Kraft on Unsplash
popular: 3
series:
category: Code
tags:
  - Rails
  - Webpack
  - Guide
---

In this post, I'll demonstrate how to set up a Rails application with Bootstrap for Webpacker.

If you'd prefer to skip the post and go straight to the demo app, you can find it here: https://github.com/rossta/rails-webpacker-bootstrap-demo

The examples and demo app described in this post use the following dependencies:
```sh
# Ruby/Rails
Rails 6.0.1
Ruby 2.6.5
Webpacker 4.2.0

# npm
@rails/webpacker 4.2.0
bootstrap 4.3.1
jQuery 3.4.1
popper.js 1.16.0
```

We'll assume we're working from a recently-created Rails 6 app with the default Webpacker installation. The examples may also work with other versions Rails that support Webpacker 4.

When the Webpacker install is run, i.e. `bin/rails webpacker:install`, it adds the file `app/javascript/packs/application.js`. webpack calls this file an "entry point" and Webpacker calls it a "pack". We'll use the terms interchangeably. Either way, this file will be the top of the dependency tree for all assets bundled by webpack.

The file initially looks something like the following:

```javascript
// app/javascript/packs/application.js
require("@rails/ujs").start()
require("channels")
```
_Note: the `require` statements in the generated javascript can be converted into `import` statements._

Installation should also insert the appropriate javascript and stylesheet "pack" tags in your application layout:

```erb
<%= stylesheet_pack_tag 'application', media: 'all' %>
<%= javascript_pack_tag 'application' %>
```

> *Tip*: If you omit the `javascript_pack_tag` and have `extract_css: false` set for your environment in `config/webpacker.yml`, then the CSS won't load! The JS bundle is necessary in this case.

### Installing bootstrap
To add Bootstrap, install via yarn:
```sh
$ yarn add bootstrap
```
At the time of this post, the above is the equivalent to `yarn add bootstrap@4.3.0`. Your installation may vary; I would expect the tutorial here will still work for other versions of Bootstrap 4.

To get Bootstrap css working, add a stylesheet `app/javascript/css/site.scss`. Here, you'll import the global Bootstrap scss file:
```scss
// app/javascript/css/site.scss

@import "~bootstrap/scss/bootstrap.scss";
```
_Note: the file extensions are important, i.e., Webpacker configure files ending in '.scss' and '.sass' to be processed by webpack's `sass-loader`._

To include our new stylesheet in the build output, we must import it from somewhere in our dependency tree. Let's put this import in the entry point, our `application.js` pack:
```javascript
// app/javascript/packs/application.js

import 'css/site'
```
If you're new to webpack, this may comes as a surprise: yes, you import your stylesheets via javascript. In Sprockets, we typically have separate `application.css` and `application.js` files as the top of separate dependency trees. In webpack, think of your application.js pack as the lone root the dependency tree from which all static assets will be imported; the `application.css` bundle is simply a by-product of the build. In other words, there is no need for a separate "stylesheet pack" like `app/javascript/packs/application.css`.

> *Tip*: With webpack, it's recommended to have only *one* entry point (or "pack" in WebpackER terminology) per page for your bundled assets. For our starter app, the entry point is `app/javascript/packs/application.js`. I cannot stress this point enough.

### Adding SASS overrides
Since `bootstrap.scss` uses SASS variables for theme-ing, you can override the defaults with new values.

For example, you can change the background and font colors as follows:

```scss
// app/javascript/css/site.scss

// sass variable overrides
$body-bg: aliceblue;
$body-color: #111;

@import "~bootstrap/scss/bootstrap.scss";
```

You may also surgically import selected parts of bootstrap to limit bundle size:

```scss
// app/javascript/css/site.scss

// Option A: Include all of Bootstrap
// @import "~bootstrap/scss/bootstrap.scss";

// Option B: Include parts of Bootstrap
@import "~bootstrap/scss/functions.scss";
@import "~bootstrap/scss/variables.scss";
@import "~bootstrap/scss/mixins.scss";

@import "~bootstrap/scss/reboot.scss";
@import "~bootstrap/scss/type.scss";
@import "~bootstrap/scss/images.scss";
@import "~bootstrap/scss/code.scss";
@import "~bootstrap/scss/grid.scss";
```
Bootstrap also ships with some JavaScript utilities that function as jQuery plugins. To enable this functionality, add jQuery and popper.js as dependencies:

```sh
yarn add jquery popper.js
```

These libraries need to be available in your webpack build, so import them along with bootstrap javascript:
```javascript
// app/javascript/packs/application.js

// ...
import 'jquery'
import 'popper.js'
import 'bootstrap'
// ...
```

### Optimizing the JavaScript bundle

An optional, advanced technique would be to import selected modules asynchronously. The benefit is to limit the size of our initial bundle and defer as much as possible to decrease latency for downloading, parsing, and evaluating JavaScript on page load. Note the `application.js` bundle (fingerprinted as `js/application-c67c235b5c7d8ac4f1fe.js`) is already 940kB in our webpack build:
```shell
Version: webpack 4.41.2
Time: 1003ms
Built at: 11/25/2019 4:08:14 PM
                                     Asset       Size       Chunks                         Chunk Names
              css/application-8d90f960.css    175 KiB  application  [immutable]            application
          css/application-8d90f960.css.map    377 KiB  application  [dev]                  application
    js/application-c67c235b5c7d8ac4f1fe.js    940 KiB  application  [emitted] [immutable]  application
js/application-c67c235b5c7d8ac4f1fe.js.map   1.06 MiB  application  [emitted] [dev]        application
                             manifest.json  640 bytes               [emitted]
ℹ ｢wdm｣: Compiled successfully.
```

As an exercise, we might decide to defer the import and initialization of the jquery plugins. Let's consider `jquery` as a critical dependency; it is needed as part of the "initial" bundle that blocks the page load while it is parsed and evaluated. But `popper.js` and `bootstrap` can be deferred; since they are plugins that affect the DOM, they're not as critical, i.e., the DOM needs to be loaded first anyways.

One such deferring technique is dynamic import. webpack will recognize when `import` is used as a function, e.g. `import('some-lib')`, and pull out the module as a separate "chunk" (another file), that will be loaded asynchronously when the function is evaluated.

In our demo app, we can move `popper.js` and `bootstrap` to a separate file. Critically, this file is NOT in `app/javascript/packs` but outside of this directory, such as `app/javascript/src`, where we will put all our non-entry-point js:

```javascript
// app/javascript/src/plugins.js

import 'popper.js'
import 'bootstrap'
```

Back in the application pack, we replace the `popper.js` and `bootstrap` imports with a *dynamic* import of `app/javascript/src/plugins.js`:
```javascript
// app/javascript/packs/application.js

import 'jquery'
import('src/plugins') // note the function usage!
```

When compiling, webpack will show us a number of additional javascript "chunks" of smaller size than the bundle previously:
```shell
Version: webpack 4.41.2
Time: 41ms
Built at: 11/25/2019 4:03:54 PM
                                     Asset       Size       Chunks                         Chunk Names
              css/application-8d90f960.css    175 KiB  application  [immutable]            application
          css/application-8d90f960.css.map    377 KiB  application  [dev]                  application
        js/0-7f46c35cf4589f8534f7.chunk.js    217 KiB            0  [immutable]
    js/0-7f46c35cf4589f8534f7.chunk.js.map    257 KiB            0  [dev]
        js/1-6bb4a0148baccc5762c4.chunk.js  926 bytes            1  [immutable]
    js/1-6bb4a0148baccc5762c4.chunk.js.map  246 bytes            1  [dev]
    js/application-0b7847cb72725f896091.js    727 KiB  application  [emitted] [immutable]  application
js/application-0b7847cb72725f896091.js.map    835 KiB  application  [emitted] [dev]        application
                             manifest.json  640 bytes               [emitted]
ℹ ｢wdm｣: Compiled successfully.
```
We've knocked the `application.js` bundle, (now fingerprinted as `js/application-0b7847cb72725f896091.js`) down to 727kB. Still sizable, but represents a significant reduction from the first pass.

Another optimization step could be to configure the [`SplitChunksPlugin`](https://webpack.js.org/plugins/split-chunks-plugin/) to code-split our bundle programmatically, but we'll save that for another post.

Our final `app/javascript/packs/application.js` file is:
```javascript
import Rails from "@rails/ujs"

import 'jquery'
import('src/plugins') // loads async

import 'css/site'

Rails.start()
```
And our final directory structure is:
```
app/
  javascript/
    css/
      site.css
    src/
      plugins.js
    packs/
      application.js
```
You can also check out the demo app for this post at https://github.com/rossta/rails-webpacker-bootstrap-demo.

I hope this post shed some light on using Bootstrap with Webpacker on Rails and wish you Happy Webpacking!
