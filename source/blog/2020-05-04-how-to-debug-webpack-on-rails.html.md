---
title: How to debug webpack on Rails
author: Ross Kaffenberger
published: false
summary: Tips for debugging your Webpacker config and build output
description: Understanding your Rails webpack configuration and build output can be a little confusing, especially if you're new to either Rails or webpack. This post contains a few tips for debugging your Webpacker setup, some specific to Rails Webpacker, some generally applicable to webpack.
pull_image: 'blog/stock/alan-emery-beetle-unsplash.jpg'
pull_image_caption: Photo by Alan Emery on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

It's nice that the Rails Webpacker gem and NPM package abstracts your webpack config... that is until you need to peek inside to make changes. In [the previous post](/blog/how-to-customize-webpack-for-rails-apps.html), I demonstrated _how_ you can make changes. To verify those changes or inspect the config for its current settings, read on.

> [Subscribe to my newsletter](https://little-fog-6985.ck.page/9c5bc129d8) to learn more about using webpack with Rails.

> For the following examples, I'm using Node v12.13.1.

### The one-liner

Here's a quick one-liner for printing the entire Rails webpack config in development:
```sh
$ RAILS_ENV=development node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
```
I like [`console.dir`](https://nodejs.org/api/console.html#console_console_dir_obj_options) as a nice alternative to `console.log` for inspecting JavaScript objects.

For inspecting the test or production configs, just update the RAILS_ENV and the target file:
```sh
$ RAILS_ENV=development node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
# or
$ RAILS_ENV=test node -e 'console.dir(require("./config/webpack/test"), { depth: null })'
# or
$ RAILS_ENV=production node -e 'console.dir(require("./config/webpack/production"), { depth: null })'
```

To make it even easier, I'll put this into a script file in `bin/inspect_webpack` with my Rails projects.
```sh
#!/usr/bin/env sh

env=${RAILS_ENV:-development}
RAILS_ENV=${env} NODE_ENV=${env} node -e "console.dir(require(\"./config/webpack/${env}\"), { depth: null })"
```
Then to run:
```sh
$ chmod a+x ./bin/inspect_webpack
$ ./bin/inspect_webpack # or
$ RAILS_ENV=test ./bin/inspect_webpack # or
$ RAILS_ENV=production ./bin/inspect_webpack
```

### On the console

For an interactive experience, you can run `node` to pull up the Node.js REPL. This is especially helpful for isolating pieces of the webpack config "tree":
```js
$ RAILS_ENV=development NODE_ENV=development node
> const config = require('./config/webpack/development')
undefined
> console.dir(config, { depth: null })
{
  mode: 'development',
  output: {
// displays the entire webpack config
// ...
> console.dir(config.plugins, { depth: null })
// displays the plugins ...
// ...
```
As with the script I showed earlier, use `test` or `production` for `RAILS_ENV` and `NODE_ENV` when starting node to inspect the configs for the other environments.

From the node console, you can also access and play around with the Webpack `environment` object directly:

```javascript
> const { environment } = require('@rails/webpacker')
undefined
> environment.plugins.get('Manifest')
// displays configured WebpackAssestsManifest plugin
```

### Debugging with DevTools

While the above examples help inspect the webpack config in a REPL, it may help to debug the config within the build process itself. It's possible to [use the `debugger` provided by Chrome DevTools on a Node.js process](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27) (as opposed to a browser's JavaScript process).

> For the following examples, I'm using Chrome Version 80.0.3987.163

We could, for example, drop a `debugger;` statement into our Webpacker webpack config:

```javascript
const { environment } = require('@rails/webpacker')

debugger

// changes I want to debug ...

module.exports = environment
```

We can then run the webpack build with the `--debug` flag:

```sh
$ ./bin/webpack --debug
```

which is in the local development environment is equivalent to:

```sh
$ RAILS_ENV=development node --inspect-brk yarn webpack --config ./config/webpack/development.js
```

Running the webpack process in debug mode will open up a websocket to communicate with Chrome DevTools:

```sh
$ ./bin/webpack --debug
Debugger listening on ws://127.0.0.1:9229/861b81ed-6f2f-4bf5-nnnn-nnnnnnnnnnnn
For help, see: https://nodejs.org/en/docs/inspector
```

Visit `chrome://inspect` in your Chrome browser and we can find a link for our running Node process in the menu:
![Screenshot of the chrome://inspect page](blog/webpack/chrome-inspect-main.png)

This will start a instance of the DevTools for your Node process where we can click "Play" to resume execution:
![Screenshot of Chrome DevTools debugger start](blog/webpack/chrome-inspect-webpack-debug-1.png)

The process halts when it hits our `debugger` statement and we can modify values on the console:
![Screenshot of Chrome DevTools console](blog/webpack/chrome-inspect-webpack-debug-2.png)

For larger (or misconfigured) projects, you may experience memory usage issues with the webpack build. The DevTools debugger also provides a Memory tab for taking heap snapshots and tracking down the memory hogs in your build process.

![Screenshot of DevTools Memory tab](blog/webpack/chrome-inpsect-memory-tab.png)
![Screenshot of DevTools heap snapshot](blog/webpack/chrome-inspect-heap-snapshot.png)

### Speed measure plugin

To help isolate slow parts of your build, I highly recommend the [Speed Measure Plugin](https://github.com/stephencookdev/speed-measure-webpack-plugin#readme) for webpack. This is a plugin you would install and configure in your project temporarily to get feedback about individual parts of the build process.

First install:

```sh
yarn add speed-measure-webpack-plugin
```

Then configure your production build (you could also do something similar for development or test):
```javascript
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const environment = require('./environment')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap(environment.toWebpackConfig())
```

And then run the production build:

```sh
$ RAILS_ENV=production NODE_ENV=production ./bin/webpack
```

The Speed Measure plugin will print additional output that may help identify the slow parts:

```sh
SMP  ⏱
General output time took 4 mins, 5.68 secs

 SMP  ⏱  Plugins
IgnorePlugin took 57.73 secs
TerserPlugin took 39.022 secs
ExtractCssChunksPlugin took 3.13 secs
OptimizeCssAssetsWebpackPlugin took 1.6 secs
ManifestPlugin took 1.55 secs
WebpackPwaManifest took 0.326 secs
ContextReplacementPlugin took 0.129 secs
HashedModuleIdsPlugin took 0.127 secs
GenerateSW took 0.059 secs
DefinePlugin took 0.047 secs
EnvironmentPlugin took 0.04 secs
LoadablePlugin took 0.033 secs
Object took 0.024 secs

 SMP  ⏱  Loaders
babel-loader, and
rev-replace-loader took 2 mins, 11.99 secs
  module count = 2222
modules with no loaders took 1 min, 57.86 secs
  module count = 2071
extract-css-chunks-webpack-plugin, and
css-loader, and
postcss-loader, and
sass-loader took 1 min, 43.74 secs
  module count = 95
css-loader, and
postcss-loader, and
sass-loader took 1 min, 43.61 secs
  module count = 95
file-loader, and
rev-replace-loader took 4.86 secs
  module count = 43
file-loader took 2.67 secs
  module count = 32
raw-loader took 0.446 secs
  module count = 1
@bedrock/package-json-loader took 0.005 secs
  module count = 1
script-loader took 0.003 secs
  module count = 1
```

See [How to boost the speed of your webpack build](https://dev.to/slashgear_/how-to-boost-the-speed-of-your-webpack-build-16h0) and the [official webpack build performance docs](https://webpack.js.org/guides/build-performance/) for a number of useful tips for improving build/compilation performance.

### Wrapping up
