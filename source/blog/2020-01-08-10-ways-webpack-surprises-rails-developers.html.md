---
title: 10 ways Webpack surprises web developers
author: Ross Kaffenberger
published: false
summary: Especially for Rails devs looking for an alternative introduction
description: When I first started working with Webpack, I was in for a few surprises. I assumed how things should behave, based on my previous experience with the Rails asset pipeline, only to learn through experience how I was wrong.
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
  - Webpack
---

When I first started working with Webpack, I didn't realize how under-prepared I was. I was tasked with [integrating Webpack in a large Rails app](/blog/from-sprockets-to-webpack.html) and I made a lot of mistakes. I assumed how things should behave based on my previous experience with the Rails asset pipeline. Many of these assumptions turned out to be wrong. This was frustrating and humbling.

In the years since, I've followed GitHub issues and StackOverflow posts and witnessed other developers going through the same frustrations I did. Following this announcement from @dhh, I expect there will be more:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Webpack is now the default JavaScript compiler for the upcoming Rails 6 🎉 <a href="https://t.co/LJzCSoPfCV">https://t.co/LJzCSoPfCV</a></p>&mdash; DHH (@dhh) <a href="https://twitter.com/dhh/status/1046634277985611776?ref_src=twsrc%5Etfw">October 1, 2018</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I'm here to help.

For a rigorous technical overview, I suggest [the docs](https://webpack.js.org/); they have gotten quite good. This post, however, aims to be an alternative introduction to Webpack, one, I hope, will help Rails developers better understand what they may be getting into.

### 1. Webpack is a module bundler

Webpack is ["a static module bundler for modern JavaScript applications"](https://webpack.js.org/concepts/). That alone isn't shocking. But for Rails developers used to unfettered access to JavaScript global scope, the switch to working in a modular system comes as a surprise. I argue that adopting Webpack effectively means understanding JavaScript modules.

So what then is a JavaScript module?

For a fantastic introduction to JavaScript modules, I suggest Preethi Kasireddy's [Javascript Modules: A Beginner's Guide](https://www.freecodecamp.org/news/javascript-modules-a-beginner-s-guide-783f7d7a5fcc/) on freeCodeCamp. I'll attempt to summarize.

Generally speaking, a JavaScript module a self-contained, reusable piece of code. This definition though is inadequate because there are different flavors of JavaScript modules, ranging from simple patterns to formal systems (soon) supported by common JavaScript runtimes.

In recent years, several popular JavaScript module definitions have become widely adoped, each with their own characteristics, including [CommonJS](https://requirejs.org/docs/commonjs.html), [Asynchronous Module Definition](https://requirejs.org/docs/whyamd.html#amd) (AMD), and [EcmaScript (ES) Modules](https://exploringjs.com/es6/ch_modules.html) to name a few.

The Rails asset pipeline never adopted any formal module systems in JavaScript. Webpack, on the other hand, can be configured to recognize any of these module formats.

Webpack transpiles your application's source files into JavaScript modules the browser can understand. It adds code to your bundle to tie these modules together. This has implications for how developers write code which means the old-school patterns that worked with the Rails asset pipeline may not work in the Webpack context. Common issues pop up constantly on StackOverflow—compilation errors, undefined objects—that underscore this knowledge gap.

### 2. Webpack treats everything as a JavaScript module

It may make sense that Webpack treats JavaScript source files as modules. It may then sound surprising that everything Webpack bundles, including CSS, images, fonts, etc., is treated as a JavaScript module.

_Say what?_ When I first heard about this, I was totally confused: how does Webpack produce stylesheets out of JS? how would you render image tag from JavaScript?

The short answer is: it depends on how Webpack is configured.

- import statements
- loaders and plugins

First it helps to understand that webpack must be configured, via extensions like [loaders]() and [plugins]() to handle different file types as modules, e.g. Webpack may not know how to deal with this

How Webpack converts JavaScript files and non-JavaScript assets to JavaScript modules depends on how it's configured. Most projects must configure Webpack to integrate with Babel to process JavaScript files written with ES2015+ syntax. Depending on configuration, a SASS file can be bundled as JavaScript Blob object that is dynamically inserted in the DOM or it can be extracted into a CSS stylesheet a side-effect of module compilation.

### 3. The dependency graph is confusing

Webpack only needs one JavaScript file in your source code as an entry point to produce a dependency graph of all the JavaScript, CSS, images, fonts, svg, etc. that you intend to bundle as static assets for the browser.

An interesting consequence of Webpack putting JavaScript first is there only needs to be one entry point to produce both a JavaScript and a CSS bundle. In Sprockets, you might have separate `application.js` and `application.css` files;

```
app/assets
├── javascripts
│   └── application.js   # produces js bundle
└── stylesheets
    └── application.css  # produces css bundle
```

In Webpack everything hangs off the javascript entry point, or "packs". So assuming you have statements like `import 'styles.css'` somewhere in your JavaScript dependency graph, both `application.js` and `application.css` bundles will be produced.

```
app/javascript
└── packs
    └── application.js   # produces both js and css bundles
```

I've seen many Rails devs get tripped up by the Webpacker convention of treating everything in the "packs" directory as entry points along with the legacy practice of declaring separate `application.js` and `application.css` files in Rails asset pipeline source. It might look like this:
```
app/javascript
└── packs
    └── application.js
    └── application.css
```
This layout will lead to surprising errors in a Webpacker project. The reason is Webpacker expects each "pack" to have a unique name and the logic considers both files to have the same name: "application", so one will be clobbered. There are some open issues to examine this problem.

### 4. You'll need to be more explicit

In Sprockets, Rails devs can use magic comments to pull in named assets from directories known the asset pipeline load path including `require_tree`, to include many files at once:

```
//= require jquery
//= require ./my_lib
//= require_tree ./my_dir
```

In the asset pipeline, `require` once-per-dependency and you're done; since `jQuery` modifies the global `window` object, once it's required, it's available everywhere.

In Webpack, because it is a module-based system, dependencies have to be more explicit. And, unless you configure Webpack otherwise, you'll need to import each module when needed. In other words, `import 'jquery'` in a Webpack bundle does not add `$` to the global scope. You need to import it *in every file* where it's needed.

```
import $ from 'jquery'

$(".posts") // ...
```

Requiring multiple files at once is more verbose in Webpack. For this, checkout the Webpack-specific function, [`require.context`](https://webpack.js.org/guides/dependency-management/#requirecontext). For example, images are not automatically bundled like they are in the Rails asset pipeline `app/assets/images` folder. To render a Webpack image in the Rails view, you will need to be explicitly require images and `require.context` can help:

```javascript
// app/javascript/packs/application.js

require.context('../images', true)
```

### 5. Global scripting is not your friend

For better or worse, every Rails I've worked on, and it's been dozens over the years, has relied on global variables provided by libraries and/or application code. Prior to JavaScript modules, this is how we shared (and often continue to share) code across different files.

```erb
<!-- posts/index.html.erb -->
<h1>Latest posts</h1>

<%= @posts.each do |post| %>
  <!-- ... -->
<% end %>

<script>
  // $ is a global variable
  $('.post.share-button').click(function() {
    // ...
  })
</script>
```

This approach is necessary and accepted when using the Rails because the Rails asset pipeline does not alone support any of the JavaScript module systems. Despite the general notion that [global variables are bad](https://stackoverflow.com/questions/2613310/ive-heard-global-variables-are-bad-what-alternative-solution-should-i-use), the practice is typical in Rails app. Many prefer this approach.

Things work differently in Webpack. Webpack does not expose any module it bundles to the global scope by default. To reference code in another module, an explicit import is explicitly imported. To reference a library, we also may import one or more of its exported modules.

Things are little trickier if we expect to access JavaScript code from a template. A few options include:

1. Attach the module to the `window` object from within your Webpack code.

    ```javascript
    import $ from 'jquery'

    window.$ = $
    ```
    This may be a valid approach in many cases although this feels a bit dirty to me and somewhat order-dependent. I typically do not recommend this approach.

1. Configure Webpack to declare what variables to "expose" to the global scope. `yarn install expose-loader`, then:

  ```javascript
  // config/webpack/environment.js

  const { environment } = require("@rails/webpacker")

  environment.loaders.append('jquery', {
      test: require.resolve('jquery'),
      use: [{
        loader: 'expose-loader',
        options: '$',
      }],
    }
  })
  ```

This serves as an illustration of how coding practices that were once considered typical in Rails applications would now be akin to swimming upstream in a Webpacker-enabled app. It may be best to avoid global scripting altogether if possible.

### 7. Legacy plugins are not your friends

Consider any jQuery plugin in your app that's more than a few years old and be prepared for any one of them to not play nice with Webpack. As I stated earlier, Webpack bundles all your JavaScript modules in local scope and expects code to be shared via explicit exports and imports via one its supported module systems. Many jQuery plugins (or many legacy plugins in general) have been written without awareness of JavaScript modules. Instead, many of these plugins assume they operate within the global scope. An example of this may be a jQuery plugin that attaches to the jQuery instance by expecting to find it attached to the window object.

A Webpack-friendly way of writing a plugin would be to test for the presence of one or more of the popular JavaScript module implementations before falling back to `window.jQuery`. This approach allows plugins to work safely in a both modular- and global-scoped environments.

One indicator I look for when evaluating compatibility of a library is whether it has been packaged with the UMD pattern as we described earlier.

### 8. Webpack is many projects

When adopting Webpack, it helps to understand that your Webpack build will likely depend on many Webpack packages. Installing Webpack itself will bring many packages into your `node_modules` of course, but this is not the end of it.

Webpack alone doesn't have the capability to process all possible file types you might use in your project. Webpack has been designed to be extremely flexible and extensible; it provides a large number of lifecycle hooks for plugins to tap into various points in the build process, e.g. such as during parsing and compilation.

This means Webpack is the ultimate delegator.

Consider a new Rails 6 project that is generated with Webpack as its asset bundler. It includes the following:

* the `webpacker` gem, declared in the `Gemfile`
* the `rack-proxy` gem, which is a dependecy of `webpacker`
* a `package.json` and a `yarn.lock` file which serve the same purpose for NPM packages as `Gemfile` and `Gemfile.lock` do for Ruby dependencies
* the `@rails/webpacker` NPM package, declared in `package.json`
* the `webpack-dev-server` NPM package, also declared in `package.json`
* hundreds of NPM packages which encompass thousands of files, brought in as subdependencies as a result of running `yarn install`

```
$ find node_modules -type d -maxdepth 1 | wc -l
     771

$ find node_modules -type f | wc -l
   15559
```

Running the Webpacker installer will also add several configuration files, including:

* `config/webpacker.yml` which is for setting values that are shared by Rails server and the Webpack build
* a number javascript files in `config/webpack` that export the project's Webpack configuration, depending on the Rails environment:

```
config/webpack
├── development.js
├── environment.js
├── production.js
└── test.js
```

* `babel.config.js` which configures behavior of the Babel transpiler needed to convert ES2015+ syntax to ES5 JavaScript
* `.browserlistrc` for declaring the range of browsers for Babel to target
* `postcss.config.js` which configures behavior of the PostCSS processor (PostCSS is like Babel, but for future CSS syntax)

That's a lot to wrap your head around.

### 9. The line between convention and configuration is blurry

Coming from Rails, which famously values "Convention over configuration", the ergonomics of setting up a Webpack configuration cause discomfort. It aims to be extremely flexible and extensible; to that end, it succeeds superbly. To serve this goal, Webpack provides a large array of [configuration options](https://webpack.js.org/configuration/). On top of that, most Webpack configurations bring in a number of [loaders](https://webpack.js.org/loaders/) and [plugins](https://webpack.js.org/plugins/), each of which have their own configuration requirements.

One of Webpacker's goals is to provide a Webpack config with sane defaults, i.e. the "convention". Depending on your project's needs, Webpacker's setup may get you quite far. For any non-trivial modification, be prepared to dive into the documentation.

One challenge of getting things working right include having an understanding of the interplay between the `config/webpacker.yml` and the resulting Webpack config produce by environment-based js files in `config/webpack/`. Make sure to check out [the Webpack docs on the subject](https://github.com/rails/webpacker/blob/c7292e9a1e158e5fc9ec3026256cf7a42d70f549/docs/webpack.md). Stay tuned for more from me on this topic as well.

### 10. Webpack is an amazing tool

To be clear, I've grown to love using Webpack and its capabilities. But this appreciation was hard-earned. Skimming the [Webpack docs](https://webpack.js.org/) was not enough for me to fully wrap my head around the new concepts.

  - Code splitting
  - Dynamic imports
  - Build stats
