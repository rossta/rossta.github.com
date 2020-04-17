---
title: Where's Webpacker's webpack config?
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

One of Webpacker's main jobs is to configure webpack for Rails apps. In an ideal world, this configuration would be transparent to Rails developers, because—let's face it—most developers would rather spend time building features than understanding their webpack setup.

In this post, we'll take a look at how Webpacker handles webpack configuration for Rails applications.

For that, Webpacker provides environment-specific JavaScript files in the `config/webpack/` directory in a Rails application.

```sh
$ tree config/webpack
config/webpack
├── development.js
├── environment.js
├── production.js
└── test.js
```

For experienced frontend developers wondering where `webpack.config.js` lives, it's here, as `config/webpack/{development,test,production}.js`.

Running `./bin/webpack` is similar to typing out one the following commands, depending on your current `RAILS_ENV`:

```sh
RAILS_ENV=development yarn webpack --config ./config/webpack/development.js
RAILS_ENV=test yarn webpack --config ./config/webpack/test.js
RAILS_ENV=production yarn webpack --config ./config/webpack/production.js
```

These files are to webpack configuration what Ruby config files `config/environments/{development,test,production}.rb` are Rails configuration: the place to customize environment-specific needs.

Just as `config/application.rb` is the "base" configuration for all environments, so is `config/webpack/environment.js` for Webpacker's webpack configuration. The `config/environment.js` file the where the base Webpack configuration is imported via `@rails/webpacker` as an object called `environment`. It is a Webpacker extraction around a webpack config that provides [its own API to support modification and extension](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration).

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

module.exports = environment
```

Each of the environment-specific files are more or less the same; they import the base `environment` object and must convert it to a JavaScript object that matches the webpack configuration schema:

```javascript
// config/webpack/development.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = require('./environment')

module.exports = environment.toWebpackConfig()
```

### Making changes

Here's the rub: Webpacker, in true Rails fashion, aims to provide convention over configuration but the design of webpack skews heavily in the other direction._Webpack_ is extremely flexible and malleable through its support for plugins and a large number of configurable options. There's no way the default Webpacker configuration can suit every use case for a diverse frontend landscape.

This means there may come a time when you need to roll up your sleeves and peel back the abstraction layer and modify the base Webpacker `environment` object. At this point, it may help to read up on [the Webpacker docs for modifying the webpack configuration](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration).

Here are just a few examples:

#### Providing jQuery as an import to legacy plugins and exposing to global scope

Here's an example of how to "provide" a jQuery import to a legacy package that doesn't understand modules and to "expose" the `$` variable for the global scope (so you can use $(...) expressions in raw `<script>` tags).

```sh
$ yarn add expose-loader
```

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')
const webpack = require('webpack')

// Adds `var jQuery = require('jquery') to legacy jQuery plugins
environment.plugins.append(
  'Provide',
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    jquery: 'jquery',
  })
)

// Adds window.$ = require('jquery')
environment.loaders.append('jquery', {
  test: require.resolve('jquery'),
  use: [
    {
      loader: 'expose-loader',
      options: '$',
    },
  ],
})

module.exports = environment
```
The `environment` object exposes methods for adding and modifying its webpack `plugins` and `loaders`. [Loaders in webpack](https://webpack.js.org/concepts/#loaders) define transforms based on file type or name; they are analogous to preprocessors in the Sprockets. Plugins in webpack can augment the output—so like loaders wi


#### Overriding the default options for compiling CSS modules

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

const myCssLoaderOptions = {
  modules: {
    localIdentName: '[name]__[local]___[hash:base64:5]',
  },
  sourceMap: true,
}

const CSSLoader = environment.loaders
  .get('sass').use.find((el) => el.loader === 'css-loader')

CSSLoader.options = { ...CSSLoader.options, ...myCssLoaderOptions }

module.exports = environment
```

Based on [source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#overriding-loader-options-in-webpack-3-for-css-modules-etc)

#### Making dotenv ENV vars available to webpack

```sh
yarn add dotenv
```

```javascript
// config/webpack/environment.js

const { environment } = require('@rails/webpacker')
const webpack = require('webpack')
const dotenv = require('dotenv')

const dotenvFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  '.env.local',
  `.env.${process.env.NODE_ENV}`,
  '.env',
]
dotenvFiles.forEach((dotenvFile) => {
  dotenv.config({ path: dotenvFile, silent: true })
})

environment.plugins.prepend(
  'Environment',
  new webpack.EnvironmentPlugin(
    JSON.parse(JSON.stringify(process.env))
  )
)

module.exports = environment
```

[source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/env.md#environment-variables)

#### Enabling webpack splitChunks

```javascript
// config/webpack/environment.js

// Enable the default config
environment.splitChunks()
// or using custom config
environment.splitChunks((config) =>
  Object.assign({}, config, {
    optimization: { splitChunks: false }
  }
))
```

[source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#add-splitchunks-webpack-v4)
[webpack splitChunks docs](https://webpack.js.org/plugins/split-chunks-plugin/)

### Debugging

The Webpacker configuration is JavaScript module consumable in Node.js. To print it out on the command line, here's a handy one-line script:

```sh
$ node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
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
