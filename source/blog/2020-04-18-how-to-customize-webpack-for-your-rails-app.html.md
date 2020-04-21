---
title: How to customize webpack for your Rails app
author: Ross Kaffenberger
published: false
summary: A closer look at @rails/webpacker configuration
description: Webpack debugging tips
pull_image: 'blog/stock/ingo-doerrie-dragonfly-unsplash.jpg'
pull_image_caption: Photo by Ingo Doerrie on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

When [webpacker.yml](/blog/how-to-use-webpacker-yml.html) is not enough, it might be necessary to modify Webpacker's webpack configuration. This is precisely the main job of Webpacker's NPM package, `@rails/webpacker`: to configure webpack for Rails apps.

This post provides an overview of how Webpacker configures webpack through `@rails/webpacker`. This is a followup to my last post on [understanding webpacker.yml](/blog/how-to-use-webpacker-yml.html).

> **tl;dr**
>
> Use **`webpacker.yml`** to modify a **limited** number of settings, some of which are shared between Rails and Webpack.
>
> Modify the base **`@rails/webpacker`** configuration for **any** webpack-specific config options in JavaScript.

## At a glance

In an ideal world, webpack configuration would be transparent to Rails developers, because—let's face it—most developers would rather spend their time building features. However, the base webpack configuration provided by `@rails/webpacker` may not satisfy your application's needs, so extending or modifying it may be inevitable.

For that, Webpacker provides environment-specific JavaScript files in the `config/webpack/` directory in a Rails application.

```sh
$ tree config/webpack
config/webpack
├── development.js
├── environment.js
├── production.js
└── test.js
```

For experienced frontend developers wondering where `webpack.config.js` lives, it's here, as `config/webpack/{development,test,production}.js`, one for each Rails environment.

Running `./bin/webpack` is similar to typing out one the following commands, depending on your current `RAILS_ENV`:

```sh
RAILS_ENV=development yarn webpack --config ./config/webpack/development.js
RAILS_ENV=test yarn webpack --config ./config/webpack/test.js
RAILS_ENV=production yarn webpack --config ./config/webpack/production.js
```

These files are to webpack configuration what Ruby config files `config/environments/{development,test,production}.rb` are Rails configuration: the place to customize environment-specific needs.

Just as `config/application.rb` is the shared configuration for all Rails environments, so is `config/webpack/environment.js` for each of the environment-specific webpack config files. The `config/environment.js` file the where the base Webpack configuration is imported via `@rails/webpacker` as an object called `environment`. It is a Webpacker extraction around a webpack config that provides [its own API to support modification and extension](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration).

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

### Under the hood

There's a problem though with making changes through an abstraction layer; it's hard to see what you want to change.

To print it out on the command line, here's a handy one-line script:

```sh
$ RAILS_ENV=development node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
```

[console.dir](https://nodejs.org/api/console.html#console_console_dir_obj_options) is a nice alternative to `console.log` for inspecting JavaScript objects.

You can even run the `node` REPL and inspecting the config object interactively:

```js
$ node
> const config = require('./config/webpack/development')
undefined
> console.dir(config, { depth: null })
// displays the entire webpack config
// ...
```
This technique displays a live version of the `development` webpack config (we can do similar for `production` or `test`). Let's look at some of the defaults that `@rails/webpacker` provides.

##### Entry

The `entry` corresponds each "pack" by its canonical name and location on disk. Webpack will create a separate dependency graph for each entry (without additional [optimization](#enabling-webpack-splitchunks)). Most Rails apps will not need to modify the Webpacker default.
```js
{
  entry: {
    application: '/path/to/rails/root/app/javascript/packs/application.js'
  },
  // ...
}
```
[webpack docs](https://webpack.js.org/concepts/#entry)

##### Output

The `output` configuration options describe where the JavaScript bundles will be output in the `public/packs` directory. Again, most Rails apps likely don't need to modfy these Webpacker defaults:

```js
{
  output: {
    filename: 'js/[name]-[contenthash].js',
    chunkFilename: 'js/[name]-[contenthash].chunk.js',
    hotUpdateChunkFilename: 'js/[id]-[hash].hot-update.js',
    path: '/path/to/rails/root/public/packs',
    publicPath: '/packs/'
  },
  // ...
}
```
[webpack docs](https://webpack.js.org/concepts/#output)

##### Loaders

##### Plugins

#####

### Making changes

Here's the rub: Webpacker, in true Rails fashion, aims to provide convention over configuration but the design of webpack skews heavily in the other direction._Webpack_ is extremely flexible and malleable through its support for plugins and a large number of configurable options. There's no way the default Webpacker configuration can suit every use case for a diverse frontend landscape.

This means there may come a time when you need to roll up your sleeves and peel back the abstraction layer and modify the base Webpacker `environment` object. At this point, it may help to read up on [the Webpacker docs for modifying the webpack configuration](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration).

Here are just a few examples:

#### Providing jQuery as an import to legacy plugins and exposing to global scope

Here's an example of how to "provide" a jQuery import to a legacy package that doesn't understand modules and to "expose" the `$` variable for the global scope (so you can use `$(...)` expressions in raw `<script>` tags).

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
  }),
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

Note the `environment` instance has `loaders` and `plugins` properties that are each implemented as bespoke `ConfigList` objects that subclass JavaScript's `Array` class ([source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/package/config_types/config_list.js)). [Loaders in webpack](https://webpack.js.org/concepts/#loaders) define transforms based on file type or name; they are analogous to preprocessors in the Sprockets. [Plugins in webpack](https://webpack.js.org/concepts/#plugins) support a wider range of tasks, like optimization or moving/copying assets, by leveraging webpack's exhaustive list of hooks to tap into the compilation process.

#### Overriding the default options for compiling CSS modules

The Webpacker config

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

const myCssLoaderOptions = {
  modules: {
    localIdentName: '[name]__[local]___[hash:base64:10]',
  },
  sourceMap: true,
}

const CSSLoader = environment.loaders.get('sass').use.find((el) => el.loader === 'css-loader')

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

module.exports = environment
```

[source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/env.md#environment-variables)

#### Enabling webpack optimization

The `splitChunks` API instructs webpack to share dependencies across bundles. Using this optimization step must be combined with different view helpers; see the[Webpacker docs](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#add-splitchunks-webpack-v4) for more info.

```javascript
// config/webpack/environment.js

// Enable the default config
environment.splitChunks()
```

[webpack splitChunks docs](https://webpack.js.org/plugins/split-chunks-plugin/)

> Tip: Use the `splitChunks` API for solving the "page-specific JavaScript" problem with Webpacker.

##### Adding module aliases

The Webpacker environment API also supports a `config.merge` function to override raw webpack config options. This example would allow you to import images from the `app/assets` directory using `import 'images/path/to/image.jpg'`.

```javascript
// config/webpack/environment.js
const { resolve } = require('path');

// Enable the default config
environment.config.merge({
  resolve: {
    alias: {
      images: resolve('app/assets/images'),
    }
  }
})
```

[webpack resolve docs](https://webpack.js.org/configuration/resolve/)

### Wrapping up

In this post, I've attempted to shed some light on the role of the `@rails/webpacker` project in your Rails app. We demonstrated how the base webpack configuration is set up along with some examples to illustrate how one might modify and extend the config for selected use cases.

For readers who need to go even further, there's no better place to go next than webpack's [Getting Started guide](https://webpack.js.org/guides/getting-started/).
