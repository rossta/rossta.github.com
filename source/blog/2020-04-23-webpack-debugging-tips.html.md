---
title: Debugging the Rails webpack config
author: Ross Kaffenberger
published: false
summary: Understanding Webpacker's webpack config
description: Webpack debugging tips
pull_image: 'blog/stock/ingo-doerrie-dragonfly-unsplash.jpg'
pull_image_caption: Photo by Ingo Doerrie on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

The Webpacker configuration is JavaScript module consumable in Node.js. To print it out on the command line, here's a handy one-line script:

```sh
$ RAILS_ENV=development node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
# or
$ RAILS_ENV=test node -e 'console.dir(require("./config/webpack/test"), { depth: null })'
# or
$ RAILS_ENV=production node -e 'console.dir(require("./config/webpack/production"), { depth: null })'
```

To make it easy, I'll put that script into a file, `bin/inspect_webpack`, in my Rails project:
```sh
#!/usr/bin/env sh

env=${RAILS_ENV:-development}
RAILS_ENV=${env} node -e "console.dir(require(\"./config/webpack/${env}\"), { depth: null })"
```

[console.dir](https://nodejs.org/api/console.html#console_console_dir_obj_options) is a nice alternative to `console.log` for inspecting JavaScript objects.

You can even run the `node` REPL and inspecting the config object interactively:

```sh
$ node
Welcome to Node.js v12.13.1.
Type ".help" for more information.
> const config = require('./config/webpack/development')
undefined
> console.dir(config, { depth: null })
{
  mode: 'development',
  output: {
    filename: 'js/[name]-[contenthash].js',
    chunkFilename: 'js/[name]-[contenthash].chunk.js',
    hotUpdateChunkFilename: 'js/[id]-[hash].hot-update.js',
    path: '/Users/ross/dev/rossta/rails6-webpacker-demo/public/packs',
    publicPath: '/packs/',
    pathinfo: true
  },
  resolve: {
    extensions: [
      .js',
# ...
> console.dir(config.plugins, { depth: null })
 ...
```

While the above examples help inspect the config outside the context of a webpack build, it may help to debug the config within the build process itself. It's possible to [use the `debugger` provided by Chrome DevTools on a Node.js process](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27) (as opposed to a browser's JavaScript process).

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
![Screenshot of webpack debugger start](blog/webpack/chrome-inspect-webpack-debug-1.png)

The process halts when it hits our `debugger` statement and we can modify values on the console:
![Screenshot of webpack debugger console](blog/webpack/chrome-inspect-webpack-debug-2.png)

### Wrapping up



For readers who need to go even further, there's no better place to go next than webpack's [Getting Started guide](https://webpack.js.org/guides/getting-started/).
