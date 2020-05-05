---
title: Debugging the Rails webpack config
author: Ross Kaffenberger
published: false
summary: Webpack on Rails quick tip
description: webpack debugging tips
pull_image: 'blog/stock/alan-emery-beetle-unsplash.jpg'
pull_image_caption: Photo by Alan Emery on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

It's nice that Rails Webpack abstracts away the webpack config until you need to peek inside to make changes. In [the previous post](/blog/how-to-customize-webpack-for-rails-apps.html), I demonstrated _how_ you can make changes. To verify those changes or inspect the config for its current settings, read on.

> [Subscribe to my newsletter](https://little-fog-6985.ck.page/9c5bc129d8) to learn more about using webpack with Rails.

> For the following examples, I'm using Node v12.13.1.

### The one-liner

Here's a quick one-liner for printing the entire webpack config in development:
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
![Screenshot of DevTools heap snapshot](blog/webpack/chrome-inpsect-heap-snapshot.png)

### Speed measure plugin

```
yarn add speed-measure-webpack-plugin
```

```javascript
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const environment = require('./environment')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap(environment.toWebpackConfig())
```

```
$ RAILS_ENV=production NODE_ENV=production ./bin/webpack
```

```
 SMP  ⏱
General output time took 3.094 secs

 SMP  ⏱  Plugins
CaseSensitivePathsPlugin took 0.391 secs
TerserPlugin took 0.306 secs
WebpackAssetsManifest took 0.066 secs
CompressionPlugin took 0.019 secs
MiniCssExtractPlugin took 0.001 secs
OptimizeCssAssetsWebpackPlugin took 0.001 secs
EnvironmentPlugin took 0 secs

 SMP  ⏱  Loaders
modules with no loaders took 1.27 secs
  module count = 365
babel-loader took 0.824 secs
  module count = 4
```

### Wrapping up
