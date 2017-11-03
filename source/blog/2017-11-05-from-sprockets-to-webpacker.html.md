---
title: From Sprockets to Webpacker
author: Ross Kaffenberger
published: false
summary: Lessons learned from adopting Webpack in an existing Rails application
descrption: In this post, we describe the challenges we faced while replacing the Rails asset pipeline with Webpack, how we solved those issues, and what we learned along the way.
pull_image: 'blog/stock/denisse-leon-mixer-board-unsplash.jpg'
pull_image_caption: Photo by Denisse Leon on Unsplash
series:
category: Code
tags:
  - Rails
  - JavaScript
  - Webpack

---

This post describes the challenges we encountered while switching from Sprockets to [Webpack](https://webpack.js.org) to compile JavaScript for our Rails application, how we solved those issues, and what we learned along the way.

While there's a lot of information out there about setting up Webpack for a new project, for those like us making the switch mid-project, with quite a bit of "Sprocket cruft" built up over several years of development, the path forward is not so clear.

As we came to learn, that path is not so straightforward either.

Before we get started:

1. I am not a Webpack expert. However, I have been using Webpack for some time to [build this blog](https://github.com/rossta/rossta.github.com/blob/1064364d9d42867a1a02b5059ebb60eb0c912565/webpack.config.js), have [written about the subject before](https://rossta.net/blog/using-webpack-with-middleman.html), and have [contributed to Webpacker](https://github.com/rails/webpacker/commits?author=rossta), and so I'd like to think I've learned something about the subject.

1. I am not attempting to convince you to ditch Sprockets for Webpack. [Giles already did that last year](http://gilesbowkett.blogspot.com/2016/10/let-asset-pipeline-die.html).

1. This is not a Webpack tutorial. I'll do my best to explain some Webpack concepts when relevant. I'll only touch on Webpack features relevant to our current application which means I'll leave out a bunch of stuff that might be important to your needs. We don't have a single-page application, nor do we use one of the currently popular frameworks like React, Angular, Vue, Ember, etc. We don't use code splitting or asynchronous modules. Webpack can bundle all kinds of assets, but we chose to migrate only our JavaScript assets in this first pass, primarily to limit scope.

1. This is not a guide on how to migrate from Sprockets to Webpack. Many decisions we made along the way resulted from team preferences and norms that might have been handled differently in another context. Should you find yourself saying, *why on Earth did they do that?*, you either have a valid point or, quite possibly, I've omitted some pertinent info which I'll otherwise do my best to explain.

That said, if you're also considering replacing Sprockets with Webpack, perhaps you can learn from our mistakes. This post may be most useful to the Rails developer who's interested to learn more about how Webpack can fit into the Rails ecosystem.

### Why switch?

The asset pipeline has served us well. In many ways, it was revolutionary in the Rails community when it was first introduced in Rails 3.1.

In the mean time, JavaScript has exploded in popularity and the collective efforts of the community have given birth to a great number of advancements, including in the domain the Sprockets was originally created to solve.

Here's a paraphrased list of reasons why we decided to switch:

* Sprockets is too slow, i.e., in development we don't want to run JavaScript compilation through our Rails process
* We want to adopt ES6 sytax and [Sprockets support for ES6 is experimental](https://github.com/TannerRogalsky/sprockets-es6#sprockets-es6)
* We wanted improved development and deployment features not available in Sprockets or without extra effort, i.e., modularity, tree-shaking, live-reload, configurable source-maps, etc.

Though there are number of JavaScript tools that we could have chosen instead Webpack, our decision here was pretty simple. As a team policy, we aim to stick with Rails conventions where possible. Given the [inclusion of Webpack in Rails](http://weblog.rubyonrails.org/2017/4/27/Rails-5-1-final/) as a default option to compile JavaScript and the general momentum in the Webpack community, this was the appropriate choice for our team.

### Webpack, the Rails Way

There's an official Rails gem for bundling JavaScript with Webpack and it's is called [Webpacker](https://github.com/rails/webpacker). Why does Webpacker exist? In short, Webpacker makes Rails aware of Webpack and helps make Webpack configuration a little easier.

Webpack is fairly complex to configure from scratch. The Webpacker gem abstracts away a default configuration and development setup with out-of-the-box ES6 support, in addition to integrations with popular frameworks like React, Angular, and Vue, so setup for a new project appears to be pretty easy.

In addition, Rails needs to be aware of Webpack output on some level so, at minimum, you can render `<script>` tags for Webpack assets.

By Webpacker convention, Webpack will build JavaScript from source files located in `app/javascript` (a new addition to the traditional Rails layout) along with `node_modules` installed via `yarn`. To determine what dependencies to build, Webpack is configured by Webpacker to treat each file in `app/javascript/packs` as a separate ["entry"](https://webpack.js.org/concepts/#entry) point. Entries in Webpack are analagous to `app/assets/javascripts/application.js` in Sprockets, along with any JavaScript file appended to the Rails configuration for asset precompilation.

For deployment, the precompile task, `rake assets:precompile`, runs both Sprockets and Webpack build steps. By default, each Webpack entry will correspond to an output file that will be compiled to the `public/packs` directory in production, analogous to the `public/assets` directory for Sprockets builds.


### Making a plan

The Webpacker defaults I've just described highlight a key feature of Webpacker critical to our decision to make the move at all:

> Webpacker allows Webpack and Sprockets to be used side-by-side.

This means it is possible to compile `some_module.js` via Webpack and `another_module.js` via Sprockets. We could then later migrate `another_module.js` to Webpack when we're ready and so on until we've nothing left to transfer. We liked this approach because it allowed us to have smaller changesets and more easily address issues through our continuous integration and QA process.

Here's a high level overview of how we broke down the move to Webpack from Sprockets:

1. *Prep phase*
  	- Add Webpacker to the project
  	- Update node.js (we use `nvm`, Node Version Manager) and install yarn on development and remote servers
  	- Deploy a small Webpack bundle, i.e., `console.log("Hello from Webpack")` to iron out deployment concerns, including Nginx and capistrano configuration

1. *Migration phase*
  	- First, move our third-party dependencies to Webpack
  	- Then, move our application dependencies to Webpack
  	- Modify Webpack configuration as needed to support new dependencies

1. *Cleanup phase*
	- Remove Rails assets gems and Sprockets bundles
	- Optimize our Webpack bundles

During each phase, we continually merged and deployed small changesets.

This gradual migration approach helped ensure the top priority: don't break the site. It also had its downsides. In fact, many of the challenges we faced were a direct consequence of supporting JavaScript compiled from either Sprockets and Webpack.

* We needed to figure out how to allow modules to talk to each other across two scopes to prevent breaking our production website with an active user base.
* We have a large suite of JavaScript unit tests which meant supporting two separate testing environments during the migration.
* We'd come to rely on global references to third party libraries in Sprockets, so any package bundled by Webpack would need to be exposed to the global scope during the transition.
* We had a learning curve with Webpack such that simply moving a dependency from a Sprockets bundle to a Webpack bundle was not always straightforward.

Furthermore, given the rapid development cycle of Webpacker, Webpack, and its various plugins and utilities, we were continually upgrading and smoothing wrinkles throughout the process.

Ultimately, we felt this "extra work" would allow us to wade into the Webpack waters more easily with time to learn and adopt new conventions as we progressed.

### Moving a JavaScript file to Webpack

Our team traditionally has compiled two Sprockets bundles for the browser: let's call them `vendor.js` and `application.js`. The `vendor` bundle is for our main third party, infrequently changing libraries like `jQuery`, `knockout.js`, and `lodash`. The `application` bundle, which changes more often, is for smaller third party plugins and our application code.

Here's an overview of what that looked like in our codebase:

```
# directory layout

app/assets/javascript
|-- vendor.js
|-- application.js
|-- some_module.js
|-- another_module.js
```
The vendor bundle required our critical libraries and frameworks from Rails asset gems.

```javascript
// app/assets/javascripts/vendor.js

//= require jquery
//= require jquery-ujs
//= require knockout
//= require lodash
// ...
```

The application bundle included some smaller plugins and our application code.

```javascript
// app/assets/javascripts/application.js

//= require some-jquery-plugin
//= require ./some_module
//= require ./another_module
//= ...
```
We rendered script tags for the vendor and application bundle respectively in the Rails application layout.

```erb
<!-- application.html.erb -->

<html>
	<body>
		<!-- ... -->

		<%= javascript_include_tag 'vendor' %>
		<%= javascript_include_tag 'application' %>
	</body>
</html>
```

To move dependencies to Webpack, we first created counterpart "packs" for `vendor.js` and `application.js`. By Webpacker convention, each file in this directory serves as a separate entry point in Webpack.

```
# directory layout

app/assets/javascript
|-- vendor.js
|-- application.js
|-- another_module.js
|-- some_module.js
app/javascript
|-- packs
	|-- vendor.js
	|-- application.js
```
We added script tags to the application layout using the helper provided by Webpacker `javascript_pack_tag` to render Webpack bundles.

```erb
<!-- application.html.erb -->

<html>
	<body>
		<!-- ... -->
		<%= javascript_pack_tag 'vendor' %>
		<%= javascript_include_tag 'vendor' %>

		<%= javascript_pack_tag 'application' %>
		<%= javascript_include_tag 'application' %>
	</body>
</html>
```
The idea was that we could port dependencies from `app/assets/javascripts` to `app/javascript` one-by-one. So, we'd move `some_module.js` from `app/assets/javascripts` to `app/javascript`, update its syntax to ES6.

```
# directory layout

app/assets/javascript
|-- vendor.js
|-- application.js
|-- another_module.js
app/javascript
|-- some_module.js
|-- packs
	|-- vendor.js
	|-- application.js
```
The syntax changes included adding an export statement to `some_module`. This allows us to import it in `app/javascript/packs/application.js` to add it to the Webpack bundle.

```javascript
// app/javascript/packs/application.js
import SomeModule from 'some_module';
```

### A brief interlude for a Babel Tip

Webpacker comes with [Babel](https://babeljs.io/) support for Webpack. Among other things, Babel allows us to use ES6-style modules and `import` and `export` syntax in our code.

To resolve modules in our application as `import 'some_module'` instead of via relative paths like `import '../some_module`, we set up an alias in `.babelrc` which is an additional set of configurations Webpacker installs for Babel.

First, we added a Babel plugin:

```
yarn add babel-plugin-module-resolver
```

Then, we added the following to our `.babelrc` in the plugins section:

```javascript
// .babelrc

{
  // ...
  "plugins": [
    // ...
    ["module-resolver", { "root": ["./app/javascript"], "alias": {} }]
  ],
}
```

### Maintaining backwards compatibility

As we gradually moved libraries and individual components from the asset pipeline to Webpack, we needed to maintain backwards compatibility with our legacy JavaScript (the "unmigrated" portion of our codebase). 

Most pages in our Rails app are initially rendered server-side via traditional Rails views, i.e., we don't have a single page application architecture. We do use [knockout.js](http://knockoutjs.com/) to process and render our dynamic content (I know, old-school). Throughout our compiled client-side JavaScript and in our Rails views, we assume a number of JavaScript globals, including `jQuery`, `knockout`, `lodash`, and our `App` application module namespace.

Why is this an issue?

It helps to understand that Sprockets and Webpack are two completely different paradigms of bundling JavaScript for the browser. The differences get to the heart of [the problems Wepback solves](https://what-problem-does-it-solve.com/webpack/intro.html#what-problem-does-webpack-solve). Instead of concatentating all your JavaScript into the global scope, as Sprockets does, Webpack provides a build system that compartmentalizes each JavaScript module into separate scopes so that access between modules must be declared via imports. By default, none of these modules are exposed to the global scope.

<aside class="callout panel">
<p>
For more background on the topic of "What problem does Webpack solve?", checkout <a href="https://twitter.com/davetron5000">David Copeland's</a> recent book, <a href="https://what-problem-does-it-solve.com/webpack/intro.html">Webpack from Nothing</a>.
</p>
</aside>

We decided, as a policy. we did not want our Webpack modules to depend on Sprockets-compiled modules. This meant we would have no references to `App.AnotherModule` in our Webpack pipeline. Therefore, to migrate an individual file, we needed to answer two questions first:

* can we import all third party dependencies of `SomeModule` from Webpack?
* can we import all application dependencies of `SomeModule` from Webpack?

As for third party dependencies, we compromised. While most of our third party JavaScript could be moved to `node_modules`, we also relied on a number of vendor JavaScript APIs loaded via script tags in the browser. So our policy here was looser; if the third party JavaScript can be installed via `yarn` and imported from `node_modules`, then we should do that. In other cases, like our Google Analytics integration, we could accept the global reference, like `window.ga` in this case, as long as it was code that would execute after DOM content loaded, and not, say, during the initial code execution phase when the script is parsed by the browser.

### Migrating a Javascript Module

Our legacy JavaScript application consistently followed a pattern of defining and accessing properties on a global JavaScript object: `window.App`.

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

Typically, we would define one new "module" per file. Given this consistency, migrating a single file to Webpack was usually pretty trivial. 

Once migrated to Webpack, the new version of our module could use ES6 syntax, supported by the Babel transpiler. We could also dependencies explicit through imports and replace references to global variables:

```javascript
// app/javascript/some_module.js

import moment from 'moment';
import AnotherModule from './another_module';

const SomeModule = {
  someMethod() {
    const timestamp = moment();
    return AnotherModule.method(timestamp);
  }
};

export default SomeModule;
```

Once `SomeModule` moved to Webpack, it is no longer available in the global scope and no longer a property of `App`. References to `App.SomeModule` in Sprockets would be `undefined`. To maintain backwards compatiblity, we wanted to make `SomeModule` available in both Webpack and Sprockets.

Practically, this meant `some_module.js` could be available through an import in Webpack:

```javascript
import SomeModule from '../some_module';

SomeModule.someMethod();
```
And in the global scope with Sprockets, it would be added back into the global `App` instance:

```javascript
App.SomeModule.someMethod();
```

In other words, we wanted to have ES6 module cake and eat it too. Luckily, Webpack provides a mechanism to do this.

### Exporting from Webpack

Webpack has provides for a use case that met our needs: that of library authors. This entails [configuring the Webpack output to export a variable](https://webpack.js.org/configuration/output/#output-library) for public consumption. That meant we would package our Webpack modules into a library for our Sprockets code!

To do this, we modified our Webpack config:

```javascript
// config/webpack/custom.js

output: {
  // Makes exports from entry packs available to global scope, e.g.
  library: ['Packs', '[name]'],
  libraryTarget: 'var'
},

// ...
```
With the above configuration, Webpack will export a module called `Packs` to the global scope. The `Packs` variable will have a property corresponding to each `entry` by name. In our case, this means Webpack exports a `Packs.vendor` and `Packs.application` properties.

To add modules to the "library", we export them from our entry files. For example:

```javascript
// app/javascript/packs/application.js

export { default as SomeModule } from './some_module`;
```

Webpack would then make `SomeModule` a property of the `application` module: `Packs.application.SomeModule`. 

Since Webpack would export this `Packs` variable to the global scope, its available in Sprockets land. We simply added some glue code to merge our `Packs` modules into `App`:

```
// app/assets/javascripts/application.js

App = App || {};
_.assign(App, Packs.application);
```

Boom! Now, we'd be able to use our Webpack-compiled module as `App.SomeModule` in Sprockets without making any other changes to our legacy JavaScript.

### Libraries and global scope

We also needed to make sure some of our third party JavaScript libraries, like jQuery and knockout, would also be available in the global scope. For this, we added special [loader](https://webpack.js.org/concepts/loaders/) to the Webpack pipeline. A Webpack loader generally describes a type of transformation for a given file type. For example, [Babel integrates with Webpack via a loader](https://github.com/rails/webpacker/blob/b2d899b25fb9f1cb11426b1b5e2d699c680bdcf6/package/loaders/babel.js) in Webpacker to transform any JavaScript file from ES6 to ES5 syntax.

At the time of this writing, we've found that the easiest way to instruct Webpack to expose varibles exported by a given library to the global scope is via the official [expose-loader](https://github.com/webpack-contrib/expose-loader). This loader is not installed as part of the Webpacker default packages, so we added to our `package.json` as follows:

```
yarn add expose-loader
```

To use the loader, we updated the default Webpack config provided by Webpacker. The Webpacker docs provide [some helpful tips](https://github.com/rails/webpacker/blob/05bf821ce983a2ad88fba0da476023e67f8efe43/docs/webpack.md#configuration) on how you might extend the default configuration using [`webpack-merge`](https://github.com/survivejs/webpack-merge). As part of our Webpack config customizations, here is the loader we use to ensure that our Webpack-compiled `jQuery` package is made available in the global scope for our legacy JavaScript:

```javascript
// config/webpack/custom.js

module: {
  rules: [
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

    // ... other custom loader rules
  ],
},

// ...
```
We have similar loader rules for each of our commonly-used libraries such as `knockout` and `lodash`. The `expose-loader` provided an easy mechanism for us to make third party libraries available both for import in Webpack and in the global scope for legacy code.

### Understanding Webpack chunks

However, not everything worked as we expected in the early going. We encountered some surprising issues with our strategy that forced us to better understand Webpack behavior.

Consider the following where we import jQuery in `vendor.js`, use the `expose-loader` as described earlier, to export `jQuery` and `$` to the global scope. Then we've added the `chosen-js` package and import it in `application.js`.

```javascript
// app/javascript/packs/vendor.js

import 'jquery';
```
```javascript
// app/javascript/packs/application.js

import 'chosen-js';
```
We can show that this works on the Dev Tools console:

```
> typeof $.fn.chosen
"function"
```
Then, we installed another jQuery plugin, like `slick-carousel`:

```
// app/javascript/packs/vendor.js
import 'jquery';
```
```
// app/javascript/packs/application.js
import 'chosen-js';
import 'slick-carousel';
```
On the Dev Tools console, we can test for the new plugin:

```
> typeof $.fn.slick
"function"
```
But something happened. The `chosen` plugin is missing:

```
> typeof $.fn.chosen
"undefined"
```
WTF?

We learned that there wre a couple issues here converging at once. Clearly, there are some side effects from importing these packages in Webpack. Turns out, we can visualize what's happening in our Webpack bundles with [`webpack-bundler-analyzer`]().

Adding this plugin to our Webpack config produces a separate local webserver that graphs the packages used in each bundle.

Here's what the analyzer produced before we added `slick-carousel`:

![](blog/webpack-bundle-analyzer-one-jquery.png)

And after we added `slick-carousel`:

![](blog/webpack-bundle-analyzer-two-jquerys.png)

Two jQuerys!

Diving deeper, we found that Webpack is doing exactly what it's supposed to do, given our current configuration. Turns out that `slick-carousel` employs a common pattern in modern JavaScript packages to detect the presence of a JavaScript module loader API, such as AMD (Asynchronous Module Definition) or requireJS. The pattern looks something like this, [excerpted from the `slick-carousel` source](https://github.com/kenwheeler/slick/blob/ee7d37faeb92c4619ffeefeba2cc4c733f39b1b3/slick/slick.js#L18):

```javascript
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
  // library code
  // ...
```

Webpack recognizes both AMD `define` and Node.js style `require` to resolve modules. Since `slick-carousel` imports `jQuery`, it's now included in the `application.js` bundle. Webpack knows nothing about how we're including both `vendor.js` and `application.js` in the same HTML page, so it happily includes `jQuery` in both bundles—exactly as it's been instructed to do.

Ok, so why didn't we see two jQuerys when we included `chosen-js`?

It's best described by [this issue on the chosen-js GitHub repository](https://github.com/harvesthq/chosen/issues/2215)

> Chosen only works with browser globals

The Chosen jQuery plugin is relatively older plugin doesn't employ a module loader pattern, so importing `chosen-js` does not have the side effect of importing `jQuery`.

To finally explain this particular issue: `jQuery` is imported by `vendor.js` and attached to the global scope. We then import `chosen-js` in the `application.js` bundle, which can attach itself to the global `jQuery` instance. When we then import `slick-carousel`, it subsequently imports `jQuery` again, which is represented by a separate "chunk" in Webpack. This new instance of `jQuery` clobbers the first in the global scope, to which we had attached `chosen`. Therefore, no `$.fn.chosen` function appears in the browser.

Through this debuggins session, we came to learn a good lesson the hard way.

> Importing a new Webpack dependency may have side effects you did not anticipate

All this is a long way of saying that things work a lot differently in Webpack and it helps to have a visual model of what's happening inside the Webpack bundles. The `webpack-bundle-analyzer` is a good place to start.

### Extracting common chunks

Turns out, we can fix our "two jQuerys" problem with some additional Webpack configuration. We essentially have to instruct Webpack to pull jQuery only into one bundle. The same concept pretty much applies to any dependency in our two bundle setup.

In our research, we found there are a few different ways of accomplishing this. Two promising strategies of note include use of community supported Webpack plugins. One of these is the [`DllPlugin`](https://webpack.js.org/plugins/dll-plugin/), which is a powerful way to split bundles and drastically improve build performance. It's also a bit more complex to setup in Webpack (though some have been successful). For ease of use, we decided to use the [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/), which we configured to separate Webpack "chunks" into particular bundles.

To ensure jQuery and any other package from `node_modules` ends up in the `vendor.js` bundle only, we add something like this to our Webpack plugins configuration:

```javascript
new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  chunks: ['vendor', 'application'],
  minChunks(module) {
    return module.context && module.context.indexOf('node_modules') >= 0;
  },
}),
```

This basic config basically says, take any "chunk" (effectively, a module) that is loaded from `node_modules` and occurs in both `vendor.js` and `application.js`, and extract it only to `vendor.js` in a way that can be shared by both modules.

#### A note on long term bundle caching

Our actual usage of the `CommonsChunkPlugin` is a bit more sophisticated as the setup described above does not behave as expected in terms of long term caching.

One would expect that making a change to the `application.js` bundle would only invalidate that bundles output during the deploy. This, in fact, is not the case.

Let's say all we did was import jQuery in our vendor bundle and `./some_module` in our application bundle:

```
// app/javascript/packs/vendor.js
import 'jquery';
```
```
// app/javascript/packs/application.js
import SomeModule from '../some_module';
```
Here's the output of the Webpack build, using the `CommonsChunkPlugin` setup as described in the previous section:

```
$ bin/webpack
Hash: 6331dfce0c27b4723c58
Version: webpack 3.8.1
Time: 779ms
                              Asset       Size  Chunks                    Chunk Names
application-5b435b20467ae799d8e6.js    3.42 kB       0  [emitted]         application
     vendor-282477ba5e90974e92cb.js     789 kB       1  [emitted]  [big]  vendor
                      manifest.json  124 bytes          [emitted]
# ...
```

Note the fingerprints of the application and vendor bundles.

Now we make only one change to `application.js` as below. `AnotherModule` brings in no new dependencies:

```
// app/javascript/packs/application.js
import SomeModule from '../some_module';
import AnotherModule from '../another_module';
```
Rebuilding now, we might expect only the digest for `application.js` would change:

```
$ bin/webpack
Hash: 7a033d5c3c2dffec095b
Version: webpack 3.8.1
Time: 758ms
                              Asset       Size  Chunks                    Chunk Names
application-80aab62cb2b8b0bfd6f3.js     4.5 kB       0  [emitted]         application
     vendor-a5762b269bc7170f5a51.js     789 kB       1  [emitted]  [big]  vendor
                      manifest.json  124 bytes          [emitted]
# ...
```

Instead, if you compare the digests of the two builds, you'll notice both bundles changed.

WTF?

Again, the root problem (and solution) gets into the real meat of how Webpack works under the hood. Rather than rehash all that here, I'll instead point you to [this excellent article on predictable long term caching with Webpack](https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31). Following the advice in that article provided would ensure Webpack generates the same fingerprinted output for our infrequently changing vendor bundle. We updated our Webpack configuration in a manner very similar to what's described there.


### Deployment concerns



### Testing

### Deployment
