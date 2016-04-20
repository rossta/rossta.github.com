---
title: Using Webpack with Middleman
author: Ross Kaffenberger
published: true
summary: 'Ditch Sprockets and embrace the external pipeline'
description: 'Explaining how to integrate the Webpack asset management tool with the Ruby static web framework Middleman'
pull_image: 'blog/stock/tundra-hike-pexels-photo.jpg'
tags:
  - Code
  - Ruby
  - JavaScript
---

I've [hosted this site on Github Pages](/blog/why-i-ditched-wordpress-for-github.html) with the [Middleman static site framework](https://middlemanapp.com/) for several years now. To keep up with the most recent release of the framework, I decided to upgrade the site to [Middleman version 4](https://middlemanapp.com/basics/upgrade-v4/). There were some significant changes to the configuration options and helper methods, which are [well documented](https://middlemanapp.com/basics/upgrade-v4/) on the Middleman blog.

By far the biggest change was the [removal of the Sprockets](https://middlemanapp.com/advanced/asset_pipeline/) dependency for the asset pipeline. Sprockets was originally a big selling point for me when choosing Middleman years ago. As a Rails developer, I had a lot of familiarity with the Sprockets style directives for bundling JavaScript and CSS assets and could use the pipeline to transpile CoffeeScript and SCSS easily.

Given the "explosion of front-end language and tooling" that has happened over the past few years though, Sprockets has fallen behind in terms of speed and flexibility, among other things. With so many tools like [Grunt](http://gruntjs.com/), [Gulp](http://gulpjs.com/), [Webpack](https://webpack.github.io), [Browserify](http://browserify.org/), [Brunch](http://brunch.io/), [Brocolli](http://broccolijs.com/)---to name a few---it would be unfeasible to support custom integrations for everything. Instead, Middleman now employs the `external_pipeline` feature which allows "subprocesses" to run alongside the development server or build process.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I surpise even myself sometimes. Middleman v4’s external pipeline feature is amazing. Integrated Webpack inside Middleman. Dev &amp; build modes</p>&mdash; Thomas Reynolds (@tdreyno) <a href="https://twitter.com/tdreyno/status/580115759768059904">March 23, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

In this post, I'll describe how I set up the external pipeline for Webpack. I'll be showing some Webpack configuration snippets to illustrate a few points but you can see the [full Webpack config file](https://github.com/rossta/rossta.github.com/blob/cc94b759ed742d571b2470777a0164ac43db9c73/webpack.config.js) for this site as of this writing as well.

### Before the upgrade

Before I upgrading the Middleman version 4, I had been using built-in Sprockets integration to configure, import, and transpile assets in the rossta.net static build. This required some custom imports in my Middleman [`config.rb`](https://github.com/rossta/rossta.github.com/blob/96444337b05e6a996b8a6f2b63f353194bc9eb4b/config.rb#L122) to make [Foundation](http://foundation.zurb.com/) CSS and JavaScript available to the Sprockets runtime.

```ruby
# config.rb
compass_config do |config|
  # Require any additional compass plugins here.
  config.add_import_path "../bower_components/foundation/scss"

  # Set this to the root of your project when deployed:
  config.http_path = "/"
  config.css_dir = "stylesheets"
  config.sass_dir = "stylesheets"
  config.images_dir = "images"
  config.javascripts_dir = "javascripts"
end

after_configuration do
  @bower_config = JSON.parse(IO.read("#{root}/.bowerrc"))
  sprockets.append_path File.join(root, @bower_config["directory"])

  sprockets.import_asset "foundation/js/vendor/jquery.cookie.js"
end
```

This configuration made it possible to require assets in JavaScript with the
"magic" Sprocket require comments, like so:

```javascript
// 3rd party javascript
//= require foundation/js/vendor/jquery
//= require foundation/js/vendor/jquery.cookie
//= require foundation

// My custom javascript
//= require zen
//= require tracking
//= require onload
```

With Sprockets dropped in Middleman version 4, this approach would no longer be
possible so I had to rethink the build pipeline. I preferred to support multiple
bundles and also wanted to upgrade my custom JavaScript to ES2015 syntax. For
this, [Webpack](https://webpack.github.io/) appeared to offer some nice advantages, though, many of the
build tools and systems mentioned earlier would also make good choices and fit
right into the new Middleman external pipeline feature.

### Enabling the External Pipeline

First step was to upgrade Middleman and remove Sprockets-based gems and
configuration from `config.rb`.

```ruby
gem "middleman", "~> 4"
```

```sh
$ bundle update middleman
```

I also deleted my Bower configuration and dependencies in favor of switching to
`npm` to manage third-party assets. To setup my npm assets:

```sh
$ npm init
$ npm install --save-dev webpack
```

The external pipeline feature in Middleman provides a mechanism for the
middleman development server to manage processes that live outside the Ruby
runtime. For Webpack, this means telling Middleman how to trigger the [Webpack
compilation command](https://webpack.github.io/docs/tutorials/getting-started/#setup-compilation).

In `config.rb`:

```ruby
activate :external_pipeline,
         name: :webpack,
         command: build? ?
         "./node_modules/webpack/bin/webpack.js --bail -p" :
         "./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
         source: ".tmp/dist",
         latency: 1
```

I copied this configuration directly from the [Middleman guides source](middleman/middleman-core/lib/middleman-core/extensions/external_pipeline.rb) which I learned made the same change recently.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Commit upgrading Middleman Guides from Asset Pipeline to Webpack: <a href="https://t.co/uP4LH19SfJ">https://t.co/uP4LH19SfJ</a></p>&mdash; Thomas Reynolds (@tdreyno) <a href="https://twitter.com/tdreyno/status/678711274516033536">December 20, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Specifying `activate :external_pipeline` enables Middleman's external pipeline
extension ([source](https://github.com/middleman/middleman/blob/6872e07d34ab037897e8466db634efb9b49b4af5/middleman-core/lib/middleman-core/extensions/external_pipeline.rb)). The three required options are worth noting:

```ruby
# middleman/middleman-core/lib/middleman-core/extensions/external_pipeline.rb
option :name, nil, 'The name of the pipeline', required: true
option :command, nil, 'The command to initialize', required: true
option :source, nil, 'Path to merge into sitemap', required: true
```

The key point to understand here is Middleman will expect the external pipeline to output the compiled files to a directory which you specify here as `:source`. We arbitrarily chose `.tmp/dist` but it doesn't matter so long as you use a dedicated destination. We'll need to configure webpack separately to send its output here.

Middleman will trigger the `:command` in a thread and buffer its output to the Middleman logger so you can see what's going on all in a single output stream. We use the `build?` flag to modify the `webpack` command for builds (which will fail fast) and development, where we want to watch for file changes and reload automatically.

An optional `:latency` can be used to set the seconds of delay between changes and refreshes.

### Setting up Webpack

Webpack as a dizzying array of plugins and configuration options. The bare minimum to get JavaScript working with Webpack and Middleman is to set an `entry` option to declare the primary source file(s) entry point and where it should compile to as the `output`:

```javascript
// webpack.config.js
var webpack = require('webpack');

module.exports = {
  entry: {
    site: './source/javascripts/site.js'
  },

  resolve: {
    root: __dirname + '/source/javascripts',
  },

  output: {
    path: __dirname + '/.tmp/dist',
    filename: 'javascripts/[name].js',
  },
};
```

This is not a full Webpack tutorial, but it worth noting we can use Webpack to do:

__Transpile from ES2015 syntax__. We can pull in Babel dependencies and desired presets from `npm` and declare `loaders` in Webpack config to customize the compilation stages. This meant I was able to rewrite much of my custom JavaScript from ES5 to ES2015 and replace Sprocket-style require comments with executable `import` statements.

```sh
$ npm install --save-dev babel babel-loader babel-preset-es2015 babel-preset-stage-0
```

```javascript
// webpack.config.js
module.exports = {
  // ...

  module: {
    loaders: [
      {
        test: /source\/assets\/javascripts\/.*\.js$/,
        exclude: /node_modules|\.tmp|vendor/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        },
      },
      // ...
    ],
  }

  // ...
};
```

__Declare global variables__. I rely on the jQuery `$` sign in enough places that
I decided to configure Webpack to treat it as a global variable so it would be
available in each of my JavaScript source files without declaring a separate
`import` everywhere. This is done with the `webpack.ProvidePlugin`:

```javascript
// webpack.config.js
module.exports = {
  // ...

  plugins: [
    // ...
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
  ],

  // ...
};
```

__Transpile SCSS to CSS__. Though Middleman still provides an integration with
Compass, [word on the street](https://benfrain.com/lightning-fast-sass-compiling-with-libsass-node-sass-and-grunt-sass/) is that Node tools like `node-sass` out-perform the Ruby Compass implementation. With the node-sass and some additional Webpack dependencies, we can transpile SCSS with Webpack to a separate css bundle:

```sh
$ npm install --save-dev node-sass sass-loader extract-text-webpack-plugin
```

```javascript
// webpack.config.js
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  // ...

  entry: {
    styles: './source/assets/stylesheets/styles.scss',
    // ...
  },

  module: {
    loaders: [
      // ...
      {
        test: /.*\.scss$/,
        loader: ExtractTextPlugin.extract(
          "style",
          "css!sass?sourceMap&includePaths[]=" + __dirname + "/node_modules"
        )
      },
      // Load plain-ol' vanilla CSS
      { test: /\.css$/, loader: "style!css" },
    ],
  }
  // ...
};
```

__Enable feature flags__. [I love puts debugging](https://tenderlovemaking.com/2016/02/05/i-am-a-puts-debuggerer.html) so I've got quite a few log statements in my JavaScript code. I don't really want these log statements in the production build of the website, so I can use Webpack to allow me to enable logging only in development:

```javascript
// webpack.config.js
var definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(JSON.parse(process.env.BUILD_DEVELOPMENT || false)),
  __PRODUCTION__: JSON.stringify(JSON.parse(process.env.BUILD_PRODUCTION || false))
});
```

I tell Webpack to make the `__DEVELOPMENT__` and `__PRODUCTION__` variables
available based on the presence on the `BUILD_DEVELOPMENT` and
`BUILD_DEVELOPMENT` environment variables. I pass these variables to the webpack
commands I'm using in `config.rb` for the build and development Middleman
contexts respectively:

```ruby
activate :external_pipeline,
         name: :webpack,
         command: build? ?
         "BUILD_PRODUCTION=1 ./node_modules/webpack/bin/webpack.js --bail -p" :
         "BUILD_DEVELOPMENT=1 ./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
         source: ".tmp/dist",
         latency: 1
```

I can then take advantage of feature flags in my JavaScript:

```javascript
function log() {
  if (__DEVELOPMENT__) {
    console.log(...arguments);
  }
}
```

My development experience is greatly enhanced with the auto-recompile feature of
webpack along with the `middleman-livereload` extension. Though I haven't tried
the `webpack-dev-server` and [hot-reloading of Webpack modules](https://webpack.github.io/docs/hot-module-replacement-with-webpack.html), it seems possible to set this up to work with Middleman.

You can go much further with Webpack of course. For more info, check out the [Webpack guides](https://webpack.github.io/) and Pete Hunt's [Webpack How-to](https://github.com/petehunt/webpack-howto).

### Moving away from Sprockets

The Middleman team has taken a big risk in dropping support for the primary asset management solution for Rails developers, likely the primary maintainers of Middleman apps. I believe it was the right choice. As someone who has been through the upgrade process, I can confirm it was challenging, but I have seen how great the payoff can be.

In my opinion, if the Rails community wishes to stay relevant in the coming years, it would be wise to adopt a similar strategy: to "future proof" the rapidly changing front-end environment, Rails should drop Sprockets and embrace the external pipeline like Middleman.
