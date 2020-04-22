---
title: How to customize webpack in Rails apps
author: Ross Kaffenberger
published: true
summary: A closer look at @rails/webpacker configuration
description: "Configuring webpack is precisely the main job of Webpacker's NPM package, @rails/webpacker. This post provides an overview of how to customize its default settings for your Rails application."
pull_image: 'blog/stock/ingo-doerrie-dragonfly-unsplash.jpg'
pull_image_caption: Photo by Ingo Doerrie on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

When [adjusting webpacker.yml](/blog/how-to-use-webpacker-yml.html) is not enough, it might be necessary to modify Webpacker's default webpack configuration. Configuring webpack is precisely the main job of Webpacker's NPM package, `@rails/webpacker`.

This post provides an overview of how to customize its default settings for your Rails application. It's a followup to my last post on [understanding webpacker.yml](/blog/how-to-use-webpacker-yml.html).

> **tl;dr**
>
> Use **`webpacker.yml`** to modify a **limited** number of settings, some of which are shared between Rails and webpack.
>
> Modify the base **`@rails/webpacker`** configuration for **any** webpack-specific config options in JavaScript.

## At a glance

In an ideal world, webpack configuration would be transparent to Rails developers. Let's face it, most developers would rather spend their time building features than configuring their asset compilation process. Still, the base webpack configuration provided by `@rails/webpacker` may not satisfy your application's needs, so modifications may be inevitable.

Some things you might want to modify or change:

* [Handling legacy jQuery plugins](#providing-jquery-as-an-import-to-legacy-plugins-and-exposing-to-global-scope)
* [Loading dotenv ENV vars in webpack](#loading-dotenv-env-vars-in-webpack)
* [Enabling webpack optimization (i.e., sharing code across bundles)](#enabling-webpack-optimization)
* [Using modules aliases](#using-module-aliases)
* [Changing the identifiers for CSS modules](#overriding-the-default-options-for-compiling-css-modules)

So, where to start?

First, we'll take a look at the environment-specific JavaScript files Webpacker installs in the `config/webpack/` directory within your Rails application:

```sh
$ tree config/webpack
config/webpack
├── development.js
├── environment.js
├── production.js
└── test.js
```

For experienced frontend developers wondering _where is `webpack.config.js`?_, it's here, as `config/webpack/{development,test,production}.js`; there is a separate config file for each Rails environment.

Running `./bin/webpack` is similar to typing out one the following commands to run `webpack` directly, depending on your current `RAILS_ENV`:

```sh
RAILS_ENV=development yarn webpack --config ./config/webpack/development.js
RAILS_ENV=test yarn webpack --config ./config/webpack/test.js
RAILS_ENV=production yarn webpack --config ./config/webpack/production.js
```

These files are to webpack configuration what Ruby config files `config/environments/{development,test,production}.rb` are Rails configuration: the place to customize environment-specific needs. Just as `config/application.rb` is the shared configuration for all Rails environments, so is `config/webpack/environment.js` for each of the environment-specific webpack config files.

The `config/environment.js` file is where the default webpack configuration is imported via `@rails/webpacker`. The named import `environment` is an abstraction around the webpack config. It provides [its own API to support modification and extension](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration).

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

There's a problem though with making changes through an abstraction layer; it's hard to see what you want to change. Since the API is not fully documented yet, you may need to do some digging.

To print it out on the command line, here's a handy one-line script:

```sh
$ RAILS_ENV=development node -e 'console.dir(require("./config/webpack/development"), { depth: null })'
# displays entire webpack config object
```

[console.dir](https://nodejs.org/api/console.html#console_console_dir_obj_options) is a nice alternative to `console.log` for inspecting JavaScript objects.

To go deeper, you may want to checkout [the source for the `Environment` class in the `@rails/webpacker` package](https://github.com/rails/webpacker/blob/40a171021f6a89117aed1317957199cf2ca72b98/package/environments/base.js#L123).

An `environment` instance has `loaders` and `plugins` properties that are each implemented as bespoke [`ConfigList`](https://github.com/rails/webpacker/blob/40a171021f6a89117aed1317957199cf2ca72b98/package/config_types/config_list.js#L5) objects that subclass JavaScript's `Array` class ([source](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/package/config_types/config_list.js)).

> [Loaders in webpack](https://webpack.js.org/concepts/#loaders) define transforms based on file type or name; they are analogous to preprocessors in the Sprockets. [Plugins in webpack](https://webpack.js.org/concepts/#plugins) support a wider range of tasks, like optimization or moving/copying assets, by leveraging webpack's exhaustive list of hooks to tap into the compilation process.

The `environment.config` property is also useful is you want to simply override defaults with a raw object matching a portion of the webpack config schema.

### Examples

Here's the rub: Webpacker, in true Rails fashion, aims to provide convention over configuration, however, the design of webpack skews heavily in the other direction: it is extremely flexible and malleable through its support for plugins and a large number of configurable options. Webpack is built to support a broad range of use cases to meet the needs of a diverse frontend landscape. Webpacker's opinionated approach may leave out something you need.

This means there may come a time when you need to roll up your sleeves and peel back the abstraction layer and modify the base Webpacker `environment` object. At this point, it may help to read up on [the Webpacker docs for modifying the webpack configuration](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#configuration). Below are just a few examples.

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

[This StackOverflow post](https://stackoverflow.com/questions/28969861/managing-jquery-plugin-dependency-in-webpack) provides more general context on making legacy jQuery play nice with webpack.

#### Loading dotenv ENV vars in webpack

A nice feature of webpack and the default webpack configuration is that it will make ENV vars available to the build process. For example, using `process.ENV.MY_API_KEY` will be compiled to `"my-api-key-value"` in your webpack build. To emulate the behavior of the popular `dotenv-rails` project, which can load ENV vars defined in `.env*` files, you could add configuration as follows:

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

[Original source in the Webpacker docs](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/env.md#environment-variables).

#### Enabling webpack optimization

The `splitChunks` API instructs webpack to share dependencies across bundles. Using this optimization step must be combined with different view helpers; see the[Webpacker docs](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#add-splitchunks-webpack-v4) for more info.

```javascript
// config/webpack/environment.js

// Enable the default config
environment.splitChunks()
```

> Tip: Use the `splitChunks` API for solving the "page-specific JavaScript" problem with Webpacker.

See the [webpack splitChunks docs](https://webpack.js.org/plugins/split-chunks-plugin/) for more info.

#### Using module aliases

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

Learn more in the [webpack resolve docs](https://webpack.js.org/configuration/resolve/).

#### Overriding the default options for compiling CSS modules

This change involves modifying an existing loader, which can be accessed using `environment.loaders.get(key)` and replacing its options property.

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

const myCssLoaderOptions = {
  modules: {
    localIdentName: '[name]__[local]___[hash:base64:10]',
  },
  sourceMap: true,
}

const CSSLoader = environment.loaders
  .get('moduleSass')
  .use
  .find((el) => el.loader === 'css-loader')

CSSLoader.options = { ...CSSLoader.options, ...myCssLoaderOptions }

module.exports = environment
```

[Original source in the Webpacker docs](https://github.com/rails/webpacker/blob/a84a4bb6b385ae17dd775a6034a0b159b88c6ea9/docs/webpack.md#overriding-loader-options-in-webpack-3-for-css-modules-etc).

### Wrapping up

In this post, I've attempted to shed some light on the role of the `@rails/webpacker` project in your Rails app. We demonstrated how the Webpacker wraps the default webpack configuration along with some examples to illustrate how one might modify and extend the config for selected use cases.

For readers who need to go even further, there's no better place to go next than webpack's [Getting Started guide](https://webpack.js.org/guides/getting-started/).
