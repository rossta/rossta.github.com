---
title: Switching from Sprockets to Webpack
author: Ross Kaffenberger
published: false
summary: Challenges and lessons learned while adopting the Webpacker gem
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

In case you missed the news, [Rails is loving JavaScript](http://weblog.rubyonrails.org/2017/4/27/Rails-5-1-final/) and Rails 5.1 ships with the option to compile JavaScript with [Webpack](https://webpack.js.org) via the [Webpacker gem](https://github.com/rails/webpacker). This is a big change after years of the Rails asset pipeline running on Sprockets. My team at [LearnZillion](https://learnzillion.com) recently decided to embrace this change and make the switch to Webpack for JavaScript compilation. *Gulp!*

This post describes the challenges we encountered while switching from Sprockets to Webpack, how we solved those issues, and what we learned along the way.

The issues we encountered may be generally relevant, this post is not intended to be a step-by-step guide for replacing the Rails asset pipeline with Webpack. This post also won't help you integrate with of the currently popular frameworks like React, Angular, Vue, or Ember (we use Knockout.js).

That said, if you're working in a legacy Rails application and considering Webpack, perhaps you can learn from our mistakes.

## Why switch?

The asset pipeline was revolutionary in the Rails community when it was first introduced in Rails 3.1 and it has served our project well over the years. In the mean time, JavaScript has exploded in popularity and the collective efforts of the community have led to many improvements, including in the domain the Sprockets was originally created to solve.

Given this context, here are a few reasons we decided to switch (paraphrasing):

* Sprockets is too slow, i.e., in development, we don't want to run JavaScript compilation through our Rails process
* To adopt ES6 syntax and [Sprockets support for ES6 is experimental](https://github.com/TannerRogalsky/sprockets-es6#sprockets-es6)
* For advanced features not available in Sprockets (or without extra effort), i.e., modularity, tree-shaking, live-reload, configurable source-maps, etc.

Though there are number of JavaScript tools that we could have chosen instead Webpack, our decision here was pretty simple. As a team policy, we aim to stick with Rails conventions where possible. Given the official support in Rails and the general momentum in the Webpack community, this was the appropriate choice for our team.

## Webpack, the Rails Way

[Webpacker](https://github.com/rails/webpacker) is the official Rails gem for integrating Webpack with Rails. [Guarav Tiwari](https://medium.com/@gauravtiwari) wrote a [detailed introduction to Webpacker here](https://medium.com/statuscode/introducing-webpacker-7136d66cddfb).

Why does Webpacker exist?

First, Webpacker helps make Webpack *Rails-friendly*. Webpack is powerful tool built to be extremely flexible. As a consequence, it is fairly complex to configure from scratch making it somewhat of an odd choice for Rails, which promotes *convention over configuration*. Webpacker fills the gap. The gem introduces some conventions and abstracts away a default configuration to make it easier to get up-and-running with, for example, out-of-the-box ES6 syntax support via [Babel](https://babeljs.io/) support in Webpack.

Also, Webpacker helps form the bridge between the Webpack build and the Rails application. Rails needs to be able to render `<script>` tags for Webpack assets in views. Webpacker provides helpers, including `javascript_pack_tag`, for this purpose.

By Webpacker convention, Webpack will build JavaScript from source files located in `app/javascript` (a new addition to the traditional Rails directory structure) and from `node_modules` installed via `yarn`. To determine what dependencies to build, Webpack is configured by Webpacker to treat each file in `app/javascript/packs` as a separate [entry](https://webpack.js.org/concepts/#entry) point. Entries in Webpack are analogous to JavaScript assets configured for Sprockets compilation via `Rails.configuration.assets.precompile`.

For deployment, the precompile task, `rake assets:precompile`, runs both Sprockets and Webpack build steps. By default, each Webpack entry will correspond to an output file that will be compiled to the `public/packs` directory in production, analogous to the `public/assets` directory for Sprockets builds. Webpack generates a `manifest.json` in `public/packs` that maps asset names to their locations. Rails will read the manifest to determine the urls for Webpack assets.

In development, there is the option to run the Webpack dev server alongside the Rails server. The benefit is the Webpack dev server will listen for JavaScript source file changes, recompile, and reload the browser automatically. To help make setup easier, Webpacker inserts a Rails middleware in development to proxy Webpack asset requests to the dev server.

## Making a plan

The key feature of Webpacker critical to our decision to making the switch is this:

> Webpacker allows Webpack and Sprockets to be used side-by-side.

The ability to compile `some_module.js` via Webpack and `another_module.js` via Sprockets allowed us to move dependencies over to Webpack gradually, in smaller changesets. This approach allowed us to more easily address issues through our continuous integration and QA process. With any upgrade, our primary goal is *Don't break the site.*

Here's a high level overview of how we broke down the move to Webpack from Sprockets:

1. *Prep phase*
  	- Add Webpacker and setup dependencies in development and remote servers (upgrade `node.js`, install `yarn`)
  	- Deploy a small Webpack bundle (with no critical code) to iron out deployment concerns, including Nginx and capistrano configuration

1. *Migration phase*
  	- Move our third-party dependencies from Rails asset gems to NPM packages via Webpack
  	- Move our application code to Webpack
  	- Modify Webpack configuration as needed to support new dependencies

1. *Cleanup phase*
	- Remove Rails assets gems and redundant Sprockets configuration
	- Optimize our Webpack bundles

Our gradual approach had its downsides, primarily that it was more time-consuming. Some the challenges we faced were a direct consequence of our dual pipeline strategy. Supporting JavaScript compiled from either Sprockets or Webpack during the migration required effort:

* We needed to figure out how to reference modules across two scopes
* We had a large suite of JavaScript unit tests to support in two separate testing environments
* We assumed global variables our in Sprockets-based JavaScript, so any module bundled by Webpack would need to be exposed to the global scope somehow
* We had a learning curve with Webpack such that simply moving a dependency from a Sprockets bundle to a Webpack bundle was not always straightforward

Furthermore, given the rapid development cycle of Webpacker, Webpack, and its various plugins and utilities, we were continually upgrading and smoothing wrinkles throughout the process.

Ultimately, we allowed ourselves time to wade into the Webpack waters and adopt new conventions as we progressed.

## Setting up Webpack entries

Our team traditionally has compiled two Sprockets bundles for the browser: let's call them `vendor.js` and `application.js`. The `vendor` bundle is for our main bundle third party, infrequently changing libraries like `jQuery`, `knockout.js`, and `lodash`. The `application` bundle, which changes more often, is for smaller third party plugins and our application code.

Here's an overview of what that looked like in our codebase:

```txt
# directory layout

app/assets/javascript
|-- vendor.js
|-- application.js
|-- some_module.js
|-- another_module.js
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

To move dependencies to Webpack, we first created counterpart "packs" for `vendor.js` and `application.js`.

> Webpacker convention: each file in the packs directory serves as a separate entry point in Webpack

```txt
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

```txt
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

## Maintaining backwards compatibility

As we moved libraries and individual components from the asset pipeline to Webpack, we needed to maintain backwards compatibility with our legacy JavaScript—-the un-migrated portion of our codebase.

As mentioned earlier, our legacy JavaScript relied heavily on the global scope. We have references to jQuery, lodash, knockout littered throughout our compiled code, Rails views, and Knockout templates. To minimize the risk in this migration, we weren't going to change that.

But why was this an issue?

It helps to understand that Sprockets and Webpack are two completely different paradigms of bundling JavaScript for the browser. The differences get to the heart of [how Webpack works](https://what-problem-does-it-solve.com/webpack/intro.html#what-problem-does-webpack-solve). Instead of concatenating all your JavaScript into the global scope, as Sprockets does, Webpack provides a runtime that compartmentalizes each JavaScript module into separate scopes via closures so that access between modules must be declared via imports. By default, none of these modules are exposed to the global scope.

<aside class="callout panel">
<h4>What problem does Webpack solve?</h4>
<p>
For more background on this topic, checkout <a href="https://twitter.com/davetron5000">David Copeland's</a> recent book, <a href="https://what-problem-does-it-solve.com/webpack/intro.html">Webpack from Nothing</a>. It may also help to understand the code that Webpack generates to form the runtime, which <a href="https://twitter.com/seanlandsman">Sean Landsman</a> nicely explains in <a href="https://www.ag-grid.com/ag-grid-understanding-webpack/">Understanding How Webpack Works</a>.
</p>
</aside>

We decided, as a policy. we did not want our Webpack modules to depend on global variables. This meant we would have no references to Sprockets-compiled code in our Webpack pipeline. Therefore, to migrate an individual file, `some_module.js`, we needed to answer two questions first:

* can we import all third party dependencies of `some_module.js` from Webpack?
* can we import all application dependencies of `some_module.js` from Webpack?

In reality, we had to compromise in some cases. While most of our third party JavaScript could be moved to `node_modules`, we also relied on a number of vendor JavaScript APIs loaded via script tags in the browser. For example, since we don't compile our Google Analytics script via Webpack and instead load this script from Google's servers, we left global references to `window.ga` in our codebase. 

<aside class="callout panel">
<h4>Guest appearance by TSort</h4>
<p>
To ensure we selected modules to migrate in the right order, we wrote a short script using <a href="https://ruby-doc.org/stdlib-2.3.0/libdoc/tsort/rdoc/TSort.html">Ruby's <code>TSort</code> module</a>. <code>TSort</code> is for topological sorting, which is to say, given a list of dependencies, sort them in a valid order such that all the dependencies of a given item are satisfied before processing that item. I'll go into more detail about how we did this in another post.
</p>
</aside>


## Migrating a Javascript Module

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

As we moved them over to Webpack, the new version of the file above might look like the example below as we converted to ES6 syntax and replaced global references with imports:

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

There's a problem though. Once `SomeModule` moved to Webpack, it was no longer available in the global scope as a property of `App`. References to `App.SomeModule` in Sprockets would be `undefined`. To maintain backwards compatibility, we had to find a way to make `SomeModule` available in both Webpack and Sprockets.

Practically, this meant `SomeModule` could be available both as an import in Webpack...

```javascript
import SomeModule from '../some_module';

SomeModule.someMethod();
```
...and in the global scope as a property the global `App` instance:

```javascript
App.SomeModule.someMethod();
```

In other words, we wanted to have our ES6 module cake and eat it too. Luckily, Webpack provides a mechanism to do this.

## Exporting from Webpack

Webpack provides for a use case that met our needs: that of library authors. This entails [configuring the Webpack output to export a variable](https://webpack.js.org/configuration/output/#output-library) to its receiving scope——in our case, the browser `window`. That meant we would package our Webpack modules into a library for our Sprockets code!

To do this, we modified our Webpack config:

```javascript
// config/webpack/shared.js

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

Webpack would then make `SomeModule` a property of the `Packs.application` module, i.e., `Packs.application.SomeModule`.

This `Packs` variable gets exported to the global scope. We added some glue code to merge our `Packs` modules into the `App` namespace as below:

```javascript
// app/assets/javascripts/application.js

App = App || {};
_.assign(App, Packs.application);
```

Boom! Now, we'd be able to use our Webpack-compiled module as `App.SomeModule` in Sprockets without making any other changes to our legacy JavaScript.

## Resolving application modules

As a convenience, we learned to resolve modules in our application as `import 'some_module'` instead of via relative paths like `import '../some_module`. To do this, we set up an alias in `.babelrc`. Webpacker installs `.babelrc` as a separate configuration file for Babel.

Adding a Babel plugin:

```shell
yarn add babel-plugin-module-resolver
```

And adding a relevant section in our `.babelrc` in the plugins section:

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

## Extending the Webpack configuration

Though Webpacker's default configuration made it easy to get started, we soon ran into the need to modify it to fit our needs. The configuration is extracted away in the `@rails/webpacker` NPM package, so we often revisit the source and debug it in the node REPL.

```shell
$ NODE_ENV=development node
> let config = require('./config/webpack/development');
```

We now have a shared file in the `config/webpack` directory that imports the Webpack configuration through its API and exports the modified config object for the enviornment-specific config files to consume.

```
// config/webpack/environment.js

const {environment} = require('@rails/webpacker');
module.exports = environment;
```
```
// config/webpack/shared.js

const merge = require('webpack-merge');
const environment = require('./environment');

// make changes
environment.loaders.set('ChosenJSLoader', {
  	test: require.resolve("chosen-js"),
	use: ["script-loader"],
  },
);

environment.plugins.set('CommonsChunkPlugin'
	new webpack.optimize.CommonsChunkPlugin({ options });

const config = environment.toWebpackConfig();

const additionalConfig = {
  // stuff to add
};

module.exports = merge(config, additionalConfig);
```
```
// config/webpack/development.js

module.exports = require('./shared');
```

The Webpacker docs also provide [some helpful tips](https://github.com/rails/webpacker/blob/05bf821ce983a2ad88fba0da476023e67f8efe43/docs/webpack.md#configuration) on how to extend the default configuration.

## Importing libraries and global scope

Though Webpack tries hard to encourage you to avoid exporting your dependencies to the global scope. Recall this wasn't an option for us.

To make our third party JavaScript libraries, like jQuery and knockout, available in the global scope, we added special [loader](https://webpack.js.org/concepts/loaders/) to the Webpack pipeline. A Webpack loader generally describes a type of transformation for a given file type. For example, [Babel integrates with Webpack via a loader](https://github.com/rails/webpacker/blob/b2d899b25fb9f1cb11426b1b5e2d699c680bdcf6/package/loaders/babel.js) in Webpacker to transform any JavaScript file from ES6 to ES5 syntax.

One way to instruct Webpack to expose variables exported by a given library to the global scope is via the official [expose-loader](https://github.com/webpack-contrib/expose-loader). To use this loader, we updated the default Webpack config provided by Webpacker to ensure that our Webpack-compiled `jQuery` package is made available in the global scope for our legacy JavaScript:

```javascript
// config/webpack/shared.js

module: {
  rules: [
   {
  	  test: require.resolve('jquery'),
	  use: [{
        loader: 'expose-loader',
        options: '$',
      }, {
        loader: 'expose-loader',
        options: 'jQuery',
      }],
    },

    // ... other custom loader rules
  ],
},

// ...
```
We have similar `expose-loader` rules for each of our commonly-used libraries such as `knockout` and `lodash`.

## Discovering Webpack chunks

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

```shell
> typeof $.fn.chosen
"function"
```
Then, we installed another jQuery plugin, like `slick-carousel`:

```javascript
// app/javascript/packs/vendor.js

import 'jquery';
```
```javascript
// app/javascript/packs/application.js

import 'chosen-js';
import 'slick-carousel';
```
On the Dev Tools console, we can test for the new plugin:

```shell
> typeof $.fn.slick
"function"
```
But something happened. The `chosen` plugin is missing:

```shell
> typeof $.fn.chosen
"undefined"
```
Not expected! Clearly, there are some side effects from importing these packages in Webpack. Turns out, there were a couple issues here converging at once.

At this point, it would help to visualize what's happening in our Webpack bundles. We can do this in development with [`webpack-bundler-analyzer`](https://github.com/robertknight/webpack-bundle-size-analyzer). Adding this plugin to our Webpack config produces a separate local webserver that graphs the packages used in each bundle.

Here's what the analyzer produced before we added `slick-carousel`:

![](blog/webpack-bundle-analyzer-one-jquery.png)

And after we added `slick-carousel`:

![](blog/webpack-bundle-analyzer-two-jquerys.png)

Two jQuerys! (You may have noticed some other modules are duplicated as well.)

It turns out that `slick-carousel` employs a common pattern in modern JavaScript packages to detect the presence of a JavaScript module loader API, such as Asynchronous Module Definition (AMD) or CommonJS. The pattern looks something like this, [excerpted from the `slick-carousel` source](https://github.com/kenwheeler/slick/blob/ee7d37faeb92c4619ffeefeba2cc4c733f39b1b3/slick/slick.js#L18):

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
}));
```

Webpack recognizes both AMD `define` and CommonJs style `require` to resolve modules. Since `slick-carousel` imports `jQuery`, as seen in the except above, it's now included in the `application.js` bundle. Webpack knows nothing about how we're including both `vendor.js` and `application.js` in the same HTML page, so it happily includes `jQuery` in both bundles—exactly as it's been instructed to do.

Ok, but why didn't we see two jQuerys when we included `chosen-js`?

The reason is that the Chosen jQuery plugin only works with browser globals, as described by [this issue on the chosen-js GitHub repository](https://github.com/harvesthq/chosen/issues/2215). It doesn't use a module loader pattern, so if we hadn't exported `jQuery` to global scope in the first place, it wouldn't have worked at all. In that case, we would have followed [this post that describes how to integrate Chosen with Webpack using the `imports-loader`](http://reactkungfu.com/2015/10/integrating-jquery-chosen-with-webpack-using-imports-loader/).

When we import `chosen-js` in the `application.js` bundle, it attaches itself to the global `jQuery` instance we imported in `vendor.js`. When we then import `slick-carousel`, it subsequently imports `jQuery` again, which is represented by a separate "chunk" in Webpack. This new instance of `jQuery` clobbers the original instance in the global. Since the original instance is the one to which the Chosen plugin attached itself, no `$.fn.chosen` function appears in the browser.

Luckily, you don't have to resort to global variables just to use Chosen or most other packages that fail to employ the module loader pattern. In most cases, there's a loader (or plugin) for that! The Webpack documentation devotes an entire [guide to shimming modules](https://webpack.js.org/guides/shimming/) that's worth your time.

If you're not able to shim a module, you can always resort to the [`script-loader`](https://webpack.js.org/loaders/script-loader/), which will evaluate the module in the global context. The main takeaway here is you may have to roll up your sleeves and dig into the source of your dependencies to understand whether they'll work in the Webpack context and/or whether you'll need to integrate with a loader or plugin.

Through our debugging sessions we came to learn a good lesson the hard way:

> Importing a new Webpack dependency may have side effects you did not anticipate

To avoid any misunderstanding about the affects of adding new dependencies to Wepback, it helps to have a visual model of the Webpack "chunks". The `webpack-bundle-analyzer` is a good place to start.

## Extracting common chunks

We fixed the "two jQuerys" problem with some additional Webpack configuration. We essentially have to instruct Webpack to pull jQuery (or just about any module) into only one bundle. 

Two promising strategies of note include use of community supported Webpack plugins. One of these is the [`DllPlugin`](https://webpack.js.org/plugins/dll-plugin/), which is a powerful way to split bundles and drastically improve build performance. It's also a bit more complex to setup and requires an extra build step.

We decided to use the [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/) instead as this was bit easier to setup in Webpacker. (If you're interested in setting up the DllPlugin with Webpacker, [check out this thread on GitHub](https://github.com/rails/webpacker/issues/702)).

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

This basic config basically says, take any "chunk" (effectively, a module) that is loaded from `node_modules` and occurs in both `vendor.js` and `application.js`, and extract it only to `vendor.js` in a way that can be shared by both modules. Rebuilding with this setup fixed our jQuery plugin issue (among other side effects of clobbering global variables).

## Adding predictable long term caching

We learned though that we had a problem with our initial `CommonsChunkPlugin` configuration.

Without prior knowledge of how Webpack works, one might expect that making a change only to a module imported by `application.js` would only affect only the application bundle output during a deploy. While using the `CommonsChunkPlugin` configuration as shown in the previous section this is, in fact, not the case.

To demonstrate, let's say all we did was import jQuery in our vendor bundle and `./some_module` in our application bundle:

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

Note the digest of the application and vendor bundles under "Asset": `application-5b435b20467ae799d8e6.js` and `vendor-282477ba5e90974e92cb.js`.

Now let's make only a change to `application.js` as below. `AnotherModule` brings in no new dependencies:

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

Instead, you'll notice both the application and vendor digests changed. Again, not expected!

The root problem (and solution) gets into the real meat of how Webpack works under the hood. First, here is [an article that has helped us better understand how Webpack works](https://www.ag-grid.com/ag-grid-understanding-webpack/) including its use of module ids to link modules in the Webpack runtime. 

Building on that primer, we followed the steps outlined in this [great article on predictable long term caching](https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31) to ensure Webpack generates the same fingerprinted output for our infrequently changing vendor bundle.


## Deploying with Capistrano and Nginx

We use Capistrano to deploy our Rails application. The `capistrano/rails` plugin adds some deployment configuration for the Rails asset pipeline, but we needed to make some changes to support Webpack properly.

Webpack compilation happens automatically with each deploy because Webpacker hooks into the `rake assets:precompile` task. This task relies on a Webpacker binstub, `bin/webpack`, which needs to be checked into version control.

We also needed to set `public/packs` and `node_modules` as shared directories to ensure Webpack build output and NPM package installation via `yarn` are shared across deploys.

```ruby
# config/deploy.rb

set :linked_dirs, fetch(:linked_dirs, []).push('public/packs', 'node_modules')
```
It also helps to be aware of that Webpacker uses the `NODE_ENV` environment variable to select the right Webpack configuration. If `NODE_ENV` is not set, it will infer its value from `RAILS_ENV`. We also have a staging environment where we use the environment variable `RAILS_ENV=staging`. Our initial Webpack deploy to staging failed because we did not have a Webpack config for staging. Since our Webpack configuration for staging would be identical to production, we simply set `NODE_ENV=production` on our staging environments:

```ruby
# config/deploy.rb

set :default_env, { 'NODE_ENV' => 'production' }
```
Finally, since we use Nginx as a reverse proxy to our Rails application, we want to be sure the proper HTTP response headers are added for anything Webpack compiles to `public/packs` to improve cacheability. So we added "packs" to our Nginx location block for assets, similar to below:

```nginx
server {
  listen 443;
  server_name example.com;
  root /path/to/application/current/public;

  location ^~ /assets|packs/ {
    gzip_static on;
    expires max;
    add_header Cache-Control public;
  }

  # ...
}
```

## Unit Testing with Karma

For unit testing our JavaScript with the Rails asset pipeline, we used [jasmine-rails](https://github.com/searls/jasmine-rails). That gem has allowed us to run JS unit tests either in the browser or on the command line. Given its tight coupling to the Rails asset pipeline, we would also have to replace our test runner. After trying out a few options, we liked the features of [Karma](https://karma-runner.github.io/1.0/index.html) and that a) it was easy to setup with Webpack, and b) supports the Jasmine assertion syntax. That meant we could port our existing tests to Karma + Webpack with minimal changes.

There are plenty of tutorials and tips out there for Karma + Webpack, including [Karma setup instructions in the Webpacker docs](https://github.com/rails/webpacker/blob/master/docs/testing.md#karma-setup-for-typescript). Here's a brief overview of what we did:

First we added several packages.

```
yarn add --dev karma karma-cli karma-sourcemap-loader karma-webpack karma-jasmine karma-chrome-launcher
```

To make Karma work with our Webpacker setup, we started with the default `karma.config.js` configuration file generated via `yarn run karma init` and made some modifications as shown below:

```javascript
// karma.conf.js

// Require our Webpack test configuration
const webpackConfig = require('./config/webpack/test.js');

// Remove the plugins to workaround for several issues
// https://github.com/webpack-contrib/karma-webpack/issues/22
// https://github.com/rails/webpacker/issues/435
const {assign} = require('lodash');
assign(webpackConfig, { plugins: [] });

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'spec/javascript/**/*.js', watched: false },
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'spec/javascript/**/*.js': ['webpack', 'sourcemap'],
    },

    // For karma-webpack extension
    webpack: webpackConfig,
  });
};
```
As you can see in the comments above, we workaround a few issues of using Karma with certain plugins, including [this issue](https://github.com/webpack-contrib/karma-webpack/issues/22) with `karma-webpack` and the `CommonsChunkPlugin` and [this issue](https://github.com/rails/webpacker/issues/435) with Webpacker's use of the `ManifestPlugin`. Turns out, to run unit tests in the Karma context, our Webpack plugins are irrelevant, so we've opted to remove them altogether in the Karma configuration for now. The downside is that our unit testing setup does not exercise our Webpack plugin configuration, but any issue there would be caught by our integration testing workflow.

Another problem we needed to solve was to keep our legacy specs in jasmine-rails passing during the transition. As soon as we moved our first critical dependency from the asset pipeline to Webpack, all of our jasmine-rails specs broke. This is because jasmine-rails assumes you're just using Sprockets and knows nothing about our Webpack output.

Fortunately, jasmine-rails allowed us to override the Rails template `spec_runner.html.erb` that gets rendered when jasmine-rails executes the test suite in the browser. We just copied the default jasmine-rails ERB layout into our project and added our Webpack "packs" in the right place.

```html
<!-- app/views/layouts/jasmine_rails/spec_runner.html.erb -->

<!DOCTYPE html>
<html>
  <head>
    <meta content="text/html;charset=UTF-8" http-equiv="Content-Type"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <title>Jasmine Specs</title>

    <%= stylesheet_link_tag *jasmine_css_files %>

    <!-- add the packs! -->
    <%= javascript_pack_tag "vendor", "application" %>

    <%= javascript_include_tag *jasmine_js_files, :defer => "defer" %>
  </head>
  <body data-no-turbolink>
    <div id="jasmine_content"></div>
    <%= yield %>
  </body>
</html>
```

Once all our unit test were ported over to Karma, we were able to remove `jasmine-rails` from our application.

## Wrapping up

Wow, you made it this far!

Perhaps the most important lesson we learned throughout this process is this:

> Choosing Webpack means investing time in understanding how it works and how to get the most out of it.

Gone are the days when we could "set it and forget it" as we did for most of our dependencies and configuration with Sprockets. Despite the ease with which Webpacker let us get Webpack running in our Rails application, it has required effort to experiment with configuration, optimize bundles, integrate with third-party modules, set up predictable, long-term caching, and stay up-to-date with rapidly changing dependencies, like Webpack itself.

As I hope I made clear, our Webpack and Webpacker experience is a work in progress. There were probably some things we could have done differently or some issues that could have been avoided with more prior knowledge. As of this writing, all of our application code now runs through Webpack compilation in development and deployment. So far, our team has been delighted by results—-a big win over our previous setup with the asset pipeline.

Hopefully, this post helped demonstrate how Webpack fits into the Rails ecosystem with Webpacker and is useful to anyone considering making the switch from the Rails asset pipeline.
