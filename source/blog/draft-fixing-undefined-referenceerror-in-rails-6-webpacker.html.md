---
title: How to fix Undefined ReferenceError in Rails 6 Webpacker
author: Ross Kaffenberger
published: false
summary: Why some JavaScript libraries don't work with webpack the way you think they should
description: Fixing Undefined ReferenceError in Rails 6 Webpacker
thumbnail: 'blog/stock/louvre-pexels-photo.jpg'
thumbnail_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpacker
---

New Outline

The Pain: Webpack doesn't play nice with the Global Scope
The Promise: Recognizing global scope issues and know how to deal with them will save you a lot of heartache.
  - Visualize what webpack does to your code
The Fix:
* Avoid global scope
  - replacing <script> tag with webpack "initializer"
  - use callback instead of js.erb
* Repair global scope issues
  - Visualize what the desired fix to your code would be
  - ProvidePlugin
  - Make note of imports-loader
* Accept global scope issues, recognize the drawbacks, deal with them in a sane way
  - treating your build as a library
  - assigning global references from webpack
  - assigning global data from Rails (gon)

# What you think and you're wrong

If you're making the switch from Sprockets to Webpacker and expecting everything will "just work", you're going to have a bad time. Making this transition effectively means adopting a new mental framework for how your code is packaged for use in the browser.

Though Sprockets and Webpacker fill the same general space in the Rails stack—bundling JavaScript, CSS, images, and other static assets for the browser—they are very different beasts.

Let's say you've been developing with Rails a long enough time and you've generally steered clear of the fast-paced churn in the JavaScript community. You've likely built up a bunch of assumptions about how an asset bundler works based on your experience with Sprockets and the Rails asset pipeline. Meanwhile, webpack has evolved from a set of concerns, including JavaScript module formats and dependency management through NPM, that are completely foreign in the Rails-asset-pipeline world. Problems arise when developers assume Webpacker will be a drop-in replacement for Sprockets;

# Things to understand about webpack

* JavaScript modules
* the Dependency Graph
* resolving dependencies
* transforming dependencies (configuration)

In this article, we'll illustrate how you can avoid common pitfalls in a new world of Webpack on Rails.

# Expecting your bundled code to be available in an unbundled context
## Unbundled code

One pitfall is attempting to call a JavaScript function within an embedded script tag.
  A slight variation of this would be calling a JavaScript function within a js.erb template.

  ## Undefined Reference Error Example


# Bundled Code that doesn't work the way you think it should
Another common issue is using code that assumes it's being evaluated in the global scope. This might happen in your code legacy code though I frequently see questions about problems using jQuery plugins.

# Packaging asset gems
There's also the problem of packaging asset gems. Currently there's no great workaround. The correct solution, I believe, is for engine maintainers to publish the frontend pieces, including JavaScript, CSS, images, etc. as a complementary package on NPM. Unfortunately, this approach hasn't been widely adopted and may require momentum in the community and acceptance by maintainers, but I don't see this happening anytime soon.

# Page-specific JavaScript
One more common problem is more subtle and potentially dangerous. It's common and confusing enough to warrant its own post or serious of posts. I'm speaking of page-specific JavaScript, which is the practice of separating out JavaScript (and maybe CSS) specific to one set of pages from the main application bundle. There's nothing wrong with idea per se; it absolutely should be a goal to send a little JavaScript to your users as possible; if you lump everything in application.js, browsers are forced to download, parse, and evaluate the

===
Much of your frustration with webpack can be alleviated once you understand this key point:

Here's a common refrain from Rails developers lately:

> In Sprockets, everything "just worked!" I don't understand why webpack is so complicated.

Why? Turns out, for certain libraries and some legacy projects, you may run into some issues upgrading your JavaScript "as is" from Sprockets to Webpacker. In this post, I'll describe some common causes and what you might be able to do to fix them.

Let's first review: webpack is the new default JavaScript compiler in Rails 6. This means, for the default installation settings, Rails will install JavaScript dependencies via yarn from the NPM (Node Package Manager) registry and will invoke the `webpack` executable with the webpack configuration provided by Webpacker.

This change has prompted developers to move their Sprockets-based JavaScript code to be compiled by Webpacker. This, unfortunately, will not always "just work."

A common error you may run into when bundling legacy code with webpack is `Undefined ReferenceError`.

In this post, I'll describe a few scenarios that may lead to this error and how you can fix it.

First,
By default, webpack does not expose your JavaScript code to the global scope.

This is a HUGE departure from what life was like with Sprockets. All your code was bundled in the global scope. You could access the jQuery `$` from anywhere: from any file in `app/assets/javascripts`, from your ERB templates, from the Devtools browser console. Life was great.

But all that's changes once you start making the switch to webpack through Webpacker. Webpack wants to treat _everything_ as a JavaScript module. In practice, this means _every file_ in your JavaScript build will have function-level scope.

In other words, `this` is not what it used to be.

Aren't global variables bad? This is a good thing, right?

Yes, I agree, this change is fundamentally better. But it's still causing you headaches in the transition. See, a lot of the code you've been writing and code from libraries and gems you've been depending on has been assuming unfettered access to that global scope as well as the presence of important dependencies on that global scope.

I can tell it's a problem because I keep answering the same question, asked numerous ways, on StackOverflow, on Twitter, and on GitHub.

The symptoms of these issues surface in a variety of ways.

With webpack:

Your code and your favorite libraries, like jQuery, no longer available in the DevTools console.

When adding a JavaScript "sprinkle" in a <script> tag in a Rails view template, you now get an `UncaughtReference` error and the code is broken.

Selected jQuery plugins don't work; instead you see `Uncaught ReferenceError: jQuery is not defined` even though you've used `yarn add jquery` and imported jquery in your Webpacker "pack" already.

WTF?

> Can someone please help me find an explanation that clarifies the correct way to add js packages for rails 6 using webpacker so that the added package is accessible globally?

Good news is, there are steps you can take to address these issues.

1. Stop relying on global scope

The idea here is simple. Stop using jQuery and jQuery plugins that rely on jQuery being available in the global scope.

Stop putting code in your <script> tags embedded in your Rails templates. Stop using javascript.erb responses.

With webpack, most, if not all, of your frontend logic can now live in pure JavaScript where it's more easily unit-testable with tools like Jest. (The Rails asset pipeline never had a great solution for JavaScript unit testing, though I really appreciated the efforts of projects like teaspoon, etc.)

### Module shimming

While avoiding the global scope altogether is a worthy goal, rewriting lots of legacy JavaScript not a realistic option for many of you, at least, not in the near term.

The good news is, you can make your legacy code with webpack.

Webpack offers quite a few tools to help you augment the behavior of your imported code at build time. With a little patience, you can "rewire" your legacy code to play nice with webpack and the global scope at the same time. It does require some patience and learning a few webpack concepts. Below I'll demonstrate a few recipes for success: how to module shim in webpack.

### Surgical repair with imports-loader

Shim selected modules with an import to replace reliance on a global variable.

When an `Undefined ReferenceError` occurs _within_ one of your third-party libraries, like a jQuery plugin, it may mean that you have legacy code that doesn't know how to import its dependencies.

For example, it's common for old jQuery plugins to rely on jQuery being available to the global scope.

Take [`chosen-js`](https://github.com/harvesthq/chosen). At the very top of its Coffeescript source file, is a reference to jQuery which the code expects to be available in the global scope.

```javascript
$ = jQuery

$.fn.extend({
  chosen: (options) ->

  # ...
```
Since webpack doesn't add code to the global scope, that plugin wouldn't be able to find jQuery, even if you've imported it elsewhere in your build.

We can fix this though using a webpack add-on called `imports-loader`. In webpack, a "loader" performs a specific, targeted file transform. With the `imports-loader`, we can add missing import statements to the build output at build time. For chosen-js, we want to add something like `import jQuery from 'jquery'` to the top of the chosen-js module.

```sh
yarn add imports-loader
```
```javascript
// config/webpack/environment.js
environment.loaders.append('chosen-js', {
  test: require.resolve('chosen-js'),
  use: [{
    loader: 'imports-loader',
    options: 'jQuery=jquery,$=jquery,this=>window',
  }],
})
```
Let's breakdown this configuration. The `test` option for a webpack loader allows us to target which file(s) this transform should apply to. We set the value using `require.resolve`, which returns the path to the file that would get required by using `require('chosen-js')`. Now this loader configuration will only run when this specific file is required in your build.

The `options` value is specific to the `imports-loader` API. `jQuery=jquery` means that the webpack will add the equivalent of `var jQuery = require("jquery")` to the output of the chosen-js module in the build. Likewise for `$=jquery`.

Some legacy modules may assume the `this` reference in scope is equivalent to `window` in the browser. This is common for files written in CoffeeScript (as is the case with chosen-js); when CoffeeScript is transpiled to JavaScript, each file is wrapped in an anonymous function: `function() { /* source */ }).call(this);`. With the option `this=>window`, the `imports-loader` will add an additional wrapper function, `function() { /* source */ }).call(window);` to the chosen-js source to ensure `this` refers to `window`.

To reiterate, using `imports-loader` does not make the imported references globally available; it instead repairs the modules you've targeted in the resulting webpack output. Use this technique with any third-party library that depends on implicit global variables that you can make available through NPM.

[See the webpack docs for more information on what's possible with imports-loader]().

1. Blanket immunization with ProvidePlugin

While the `imports-loader` allows for targeted substitution of global references with imports, the webpack `ProvidePlugin` provides a similar fix by applying the change everywhere in your build.

In other words, ProvidePlugin says, "Automatically load the specified module _anywhere_ the reference is encountered."

For example, instead of the `imports-loader` fix for a single file we described in the previous section, we could use the following configuration with `ProvidePlugin`:

```javascript
// config/webpack/environment.js

const webpack = require('webpack')
environment.plugins.append('jQuery', new webpack.ProvidePlugin({
  "jQuery": "jquery",
  "$": "jquery"
}))
```
Notably, the above configuration (or something similar) will show up in just about every "Using jQuery with webpack" tutorial you'll find online. Hopefully you'll understand that this configuration is not strictly necessary to make jQuery work with webpack; it's just one tool you _might_ want to use if you're struggling to get legacy jQuery plugins to work with webpack when those plugins assume jQuery is available in the global scope.

[Check out the webpack docs for more information on ProvidePlugin](https://webpack.js.org/plugins/provide-plugin/).

Example

1. Export app code as a library

1. Set window

To make any reference available to the global scope from within your webpack build, assign the reference to the window object.

```sh
yarn add jquery
```
```javascript
// app/javascript/packs/application.js

import $ from "jquery"
window.$ = window.jQuery = $
```

```javascript
app/javascript/packs/application.js:

import jQuery from 'jquery'

const jQueryProp = {
  value: jQuery,
  configurable: false,
  writable: false
}

Object.defineProperties(window, { jQuery: jQueryProp, $: jQueryProp })
```

This change make jQuery available as `$` or `jQuery` in Rails template <script> tags and in the console. It _might_ fix an `Uncaught ReferenceError: jQuery is not defined` in a jQuery plugin that assumes jQuery is available in the global scope.

Of course, you can do this for your own code as well. It'd be typical to introduce a namespace to avoid polluting the `window` with a bundle of extra properties.

```javascript
// app/javascript/src/edit_map.js

export default function editMap() {
  // ...
}

window.App = window.App || {}
window.App.editMap = editMap
```
This example makes the `editMap` function available to the global scope as `App.editMap`.

To be clear, I'm not recommending this approach. But, it's one of the easiest to implement. Consider this approach a blunt instrument. It may not fix all your global variable problems.

I prefer to use webpack configuration techniques, as described below, to limit the side effects present in my own JavaScript code.

1. Use expose-loader to add to make variables available to the global scope

Some scripts expect a variable to be in the global scope

Example:
https://github.com/rossta/rails6-webpacker-demo/compare/example/open-tok-layout

Another technique is to make a reference available to all the code within the webpack bundle. This is not equivalent to adding the reference to the global scope; the reference will not be visible to script tags and the devtools console, for example. Within your webpack modules though, the reference will behave as if it’s globally visible. Webpack will “provide” the reference throughout the build without having to explicitly import it. This is useful for handling legacy plugins you don’t want to directly modify. It’s most commonly show in tutorials that describe how to make jQuery work with webpack. Just know that this is not strictly necessary nor is it the only way to make jQuery and jQuery plugins compatible with webpack.

What if you really need a reference in the global scope? It can be done. Here are a few techniques to consider as part of your tool belt.

The expose-loader is one option for exposing selected references to the global scope. This approach is especially effective for targeting a specific library. If there’s a reference in the top of the module’s scope, you can configure webpack with the expose-loader to make this reference available to the global scope. Again jQuery is a common example you’ll see but it could work for any reference.

One of my favorite approaches

Bug links
https://stackoverflow.com/questions/62631682/rails-6-webpacker-with-cropperjs-or-any-javascript-package

https://stackoverflow.com/questions/62649100/why-is-an-existing-javascript-function-not-found-generating-uncaught-referenceer
https://stackoverflow.com/questions/56022108/migrating-rails-from-asset-pipeline-to-webpacker-uncaught-referenceerror-is
https://www.reddit.com/r/rails/comments/dg2c0z/cant_get_action_specific_javascript_working_in/

https://www.reddit.com/r/rails/comments/dzgr0z/uncaught_referenceerror_or_how_to_work_with_js_in/

https://www.highcharts.com/forum/viewtopic.php?t=42351

> Technically, if you use CoffeeScript with Sprockets, each file will be wrapped within an immediately-invoked function expression, so your application code would not be exposed to the global scope in this case.

> Again, this is an oversimplification. In production, webpack will concatenate ES6 modules in your bundle into a single scope, when possible, a process also known as "scope hoisting" to improve execution times; otherwise, it can be costly to wrap every file in the application in separate functions in practice. See the webpack docs for more information.

Resources:
https://inopinatus.org/2019/09/14/webpacker-jquery-and-jquery-plugins/
