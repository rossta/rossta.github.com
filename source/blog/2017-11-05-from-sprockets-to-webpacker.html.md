---
title: From Sprockets to Webpacker
author: Ross Kaffenberger
published: false
summary: From Sprockets to Webpacker
description: From Sprockets to Webpacker
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
  - JavaScript
  - Webpack
---
This post describes the challenges we encountered while switching from Sprockets to [Webpack](https://webpack.js.org) to compile JavaScript for our Rails application. For teams like ours, making the switch mid-project, with quite a bit of "Sprocket cruft" built up over several years of development, the path forward is not so clear.

Disclaimer 1: I am not a Webpack expert, but I have some relevant experience. I have been using Webpack for some time to [build this blog](https://github.com/rossta/rossta.github.com/blob/1064364d9d42867a1a02b5059ebb60eb0c912565/webpack.config.js), [written about the subject before](https://rossta.net/blog/using-webpack-with-middleman.html), and [have made a number of contributions to Webpacker](https://github.com/rails/webpacker/commits?author=rossta).

Disclaimer 2: Though I hope this retrospective will be useful to other teams considering the same change, it's not intended to be a tutorial or a definitve resource. Many decisions we made along the way resulted from team preferences and norms that might have been handled differently in another context. Should you find yourself saying, *why on Earth did they do that?*, you either have a valid point or, quite possibly, I've omitted some pertinent info which I'll otherwise do my best to explain.

## Because, reasons

This post is also not intended to convince you of why you might want to consider switching from Sprockets to Webpack. That said, here is a selective list of over-simplifications and opinions that led us to make this choice:

* Sprockets is too slow, i.e., in development we don't want to run JavaScript compilation through our Rails process
* Sprockets is old, i.e., we want to leverage the benefits of modern JavaScript tooling that have surpassed Sprockets in recent years
* We want to adopt ES6 and [Sprockets support for ES6 is experimental](https://github.com/TannerRogalsky/sprockets-es6#sprockets-es6)
* We want other features not available in Sprockets or without extra effort, i.e., modularity, tree-shaking, live-reload

Though there are number of JavaScript tools that we could have chosen instead Webpack, a team policy of ours is to stick with Rails conventions where possible. Given the [inclusion of Webpack in Rails](http://weblog.rubyonrails.org/2017/4/27/Rails-5-1-final/) as a default option to compile JavaScript and the general momentum in the Webpack community, this was the appropriate choice for our team.

## Webpack, the Rails Way

There's an official Rails gem for bundling JavaScript with Webpack and it's is called [Webpacker](https://github.com/rails/webpacker). Why does Webpacker exist? In short, Webpacker makes Rails aware of Webpack and helps make Webpack a little easier.

Webpack is fairly complex to configure from scratch. The Webpacker gem abstracts away a default configuration and development setup with out-of-the-box ES6 support, in addition to integrations with popular frameworks like React, Angular, and Vue, so setup for a new project appears to be pretty easy.

In addition, Rails needs to be aware of Webpack output on some level so, at minimum, you can render `<script>` tags that point to Webpack-compiled assets.

By Webpacker convention, Webpack will build JavaScript from a new top-level folder  `app/javascript` along with `./node_modules` (installed via `yarn`). To determine what dependencies to build, Webpack is configured by Webpacker to treat each file in `app/javascript/packs` as a separate ["entry"](https://webpack.js.org/concepts/#entry) point. Entries in Webpack are analagous to `app/assets/javascripts/application.js` in Sprockets, along with any JavaScript file appended to the Rails configuration for asset precompilation.

For deployment, the precompile task, `rake assets:precompile`, runs both Sprockets and Webpack build steps. By default, each Webpack entry will correspond to an output file that will be compiled to the `public/packs` directory in production, analogous to the `public/assets` directory for Sprockets builds.


## Making a plan

The Webpacker defaults I've just described highlight a key feature of Webpacker critical to our decision to make the move at all:

> Webpacker allows Webpack and Sprockets to be used side-by-side.

This means it is possible to compile `some_module.js` via Webpack and `another_module.js` via Sprockets. We could then later migrate `another_module.js` to Webpack when we're ready and so on until we've nothing left to transfer. We liked this approach because it allowed us to have smaller changesets and more easily address issues identified during our continuous integration and QA process.

This gradual migration approach has its downsides. In fact, many of the challenges we faced were a direct consequence of needing to support JavaScript compilation in Sprockets and Webpack side-by-side. We needed to figure out how to allow modules to talk to each other across two scopes to prevent breaking our production website with an active user base. We have a large suite of JavaScript unit tests which meant we also needed to support two separate JS testing environments during the migration. We'd come to rely on global references to third party libraries in Sprocket, so any package bundled by Webpack would need to be exposed to the global scope. Ultimately, we felt this "extra work" would allow us to wade into the Webpack waters more easily, allowing us time to learn and adopt new conventions as we progressed.

## The bundles

To start to process, we decided we would generate a Webpack entry to correspond to each of our Sprockets bundles and we would render script tags pointing to these sister bundles side-by-side in the markup.

Our team traditionally has compiled two Sprockets bundles for the browser: one called `head.js` for critical JavaScript to be rendered in the `<head>` tag and `application.js` to be rendered toward the end of the `<body>` tag. Here's an overview of what that looks like in our codebase:

```
# directory layout
app/assets/javascript
|-- head.js
|-- application.js
|-- some_module.js
|-- another_module.js
```

```ruby
# some initializer
Rails.application.config.assets.precompile += ['head.js']
```

```javascript
// app/assets/javascripts/application.js
//= require ./some_module
//= require ./another_module
```

```erb
<!-- application.html.erb -->
<html>
	<head>
		<!-- ... -->

		<%= javascript_include_tag 'head' %>
	</head>

	<body>
		<!-- ... -->

		<%= javascript_include_tag 'application' %>
	</body>
</html>
```

So we first created Webpack counterpart "packs" for `head.js` and `application.js` where we could porting dependencies from `app/assets/javascripts` to `app/javascript`, one-by-one. Anything required in Sprocket `head.js` would eventually move Webpack `head.js` and same for the sister `application.js` bundles.


```
# directory layout
app/assets/javascript
|-- head.js
|-- application.js
|-- another_module.js
app/javascript
|-- some_module.js
|-- packs
	|-- head.js
	|-- application.js
```
```javascript
// app/assets/javascripts/application.js
//= require ./another_module
```
```javascript
// app/javascript/packs/application.js
import SomeModule from './some_module';
```
```erb
<!-- application.html.erb -->
<html>
	<head>
		<!-- ... -->

		<%= javascript_pack_tag 'head' %>
		<%= javascript_include_tag 'head' %>
	</head>

	<body>
		<!-- ... -->

		<%= javascript_pack_tag 'application' %>
		<%= javascript_include_tag 'application' %>
	</body>
</html>
```

## Backwards Compatibility

As we gradually move libraries and individual components from the Sprockets to Webpack pipeline, we needed to maintain backwards compatibility with the Sprockets way of referencing JavaScript modules. Most pages are initially rendered server-side via traditional Rails views, as opposed to single-page application architecture, we use [knockout.js](http://knockoutjs.com/) to process and render our dynamic content (I know, old-school). Throughout our compiled client-side JavaScript and in our Rails views, we assume a number of JavaScript globals , including `jQuery`, `knockout`, `lodash`, and our `window.App` application module namespace.

So, why is this an issue?

It helps to understand that Sprockets and Webpack are two completely different paradigms of bundling JavaScript for the browser. The differences get to the heart of [the problems Wepback solves](https://what-problem-does-it-solve.com/webpack/intro.html#what-problem-does-webpack-solve). Instead of concatentating all your JavaScript into the global scope, as Sprockets does, Webpack provides a build system that compartmentalizes each JavaScript module into separate scopes so that access between modules must be declared via imports. By default, none of these modules are exposed to the global scope.

<aside>For more background on the topic of "What problem does Webpack solve?", checkout [David Copeland's](https://twitter.com/davetron5000) recent book, [Webpack from Nothing](https://what-problem-does-it-solve.com/webpack/intro.html)).</aside>

To maintain backwards compatiblity, we wanted provide a bridge between our Webpack and Sprockets modules and libraries. As a matter of principle, we wanted to avoid using global references in our Webpack modules, using only imports instead. To avoid changing our legacy Sprockets code, we needed to provide a way to ensure Webpack modules were exposed to the global scope.

Here's how we did it.

## Vendor libraries and global scope

First, for any third party JavaScript used in the global scope, we added a custom [loader](https://webpack.js.org/concepts/loaders/) to the Webpack pipeline. A Webpack loader generally describes a type of transformation for a given file type. For example, [Babel integrates with Webpack via a loader](https://github.com/rails/webpacker/blob/b2d899b25fb9f1cb11426b1b5e2d699c680bdcf6/package/loaders/babel.js) in Webpacker to transform any JavaScript file from ES6 to ES5 syntax.

At the time of this writing, we've found that the easiest way to instruct Webpack to expose varibles exported by a given library to the global scope is via the official [expose-loader](https://github.com/webpack-contrib/expose-loader). For example, here's the loader we use to ensure that our Webpack-compiled `jQuery` package is made available in the global scope for our legacy JavaScript:

```
// excerpt from a sample Webpack config
module: {
  rules: [
    // jQuery loader rules
    {
  	   test: require.resolve("jquery"),
		use: [{
         loader: "expose-loader",
         options: "$"
       }, {
         loader: "expose-loader",
         options: "jQuery"
       }],
    },

    // ... other loader rules
  ],
},
```

Further more, we needed a way to merge our Webpack-compiled application modules to the `window.App` namespace so we could maintain corresponding references in Sprockets.


## Migrating a Javascript Module

Our legacy JavaScript application consistently followed a pattern of defining and accessing properties on a global JavaScript object, like `window.App`.

```javascript
// app/assets/javascripts/some_module.js
App = App || {};

App.SomeModule = (function() {
  someMethod: function() {
    var timestamp = moment();
    return App.AnotherModule.method(timestamp);
  }
}();
```

Typically, we would define one new "module" per file in a manner and dependencies on other `App` modules or third-party javascript would be implicit. Given this consistency, migrating a single file to Webpack was usually pretty trivial. In Webpack with Babel's ES6 transpiler, we could now make dependencies explicit and export an ES6 module instead of adding to the `App` namespace in each file:

```javascript
import moment from 'moment';
import AnotherModule from './another_module';

const SomeModule = {
  someMethod() {
    const timestamp = moment();
    return AnotherModule.method(timestamp);
  }
};
```

However, to migrate an individual file, we needed to answer two questions first:

* can we import all application dependencies of `SomeModule`?
* can we import all third party dependencies of `SomeModule`?

Keep in mind that, during the migration, some of our application depedencies
would be compiled by Sprockets, and therefore, available on the global
`window.App` namespace at runtime. However, we decided we did not want our
Webpack modules to depend on Sprockets-compiled modules. Therefore, to migrate a
given file, our policy was that all of its application dependencies should be
migrated first.

As for third party dependencies, we compromised in that, while most of our third party JavaScript could be moved to `./node_modules`, we also relied on a number of vendor JavaScript APIs loaded via script tags in the browser. So our policy here was looser; if the third party JavaScript can be installed via `yarn` and required from `./node_modules`, then we should. In other cases, like our Google Analytics integration, we could live with calling `window.ga` as long as it was code that would execute after DOM content loaded, and not, say, during the initial code execution phase when the script is parsed by the browser.

Given our widespread usage of JavaScript libraries throughout

### Strategy

- Backwards compat
- Global vars

### Dependencies

* Loaders
* Requires
* Sprockets assets

### Configuration changes

* Dev Server, SSL
* Nginx
* Commons Chunk Plugin

### Testing

* Karma integration
* Jasmine-Rails workaround

### Deployment

### Gotchas

* Various dependencies
- jQuery
- knockout
