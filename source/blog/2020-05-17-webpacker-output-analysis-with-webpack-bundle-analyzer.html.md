---
title: Webpacker output analysis with webpack-bundle-analyzer
author: Ross Kaffenberger
published: false
summary: The tool every Rails team should be using with Webpacker
description: Webpacker output analysis with webpack-bundle-analyzer
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
pull_image_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

The output of the development and production builds will be differ, possibly significantly; webpack will include a number of optimizations to improve output size and performance in the production build which would be omitted in the development build.

### Installation and usage

```
yarn add --dev webpack-bundle-analyzer
```

To use the webpack-bundler-analyzer, you can either integrate it as plugin to your Webpacker configuration or you use a two-step command line process.

#### Option 1: Integrated setup

```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

if (process.env.WEBPACK_ANALYZE) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  environment.plugins.append('BundleAnalyzerPlugin', new BundleAnalyzerPlugin())
}

module.exports = environment
```

Note that the plugin is added only when the `WEBPACK_ANALYZE` enviroment variable is present.

To visualize the development build, run the following command:

```sh
$ WEBPACK_ANALYZE=true RAILS_ENV=development NODE_ENV=development ./bin/webpack
```

To visualize the production build, run this command instead:

```sh
$ WEBPACK_ANALYZE=true RAILS_ENV=production NODE_ENV=production ./bin/webpack
```

#### Option 2: Analyze JSON from command line

If you're reluctant to modify your webpack config for a development tool (or at all), you can take advantage of the command-line interface to webpack-bundle-analyzer instead.

```sh
RAILS_ENV=production NODE_ENV=production bin/webpack --profile --json > tmp/webpack-stats-production.json
```
Analyze the stats.json file:
```sh
npx webpack-bundler-analyzer tmp/webpack-stats-production.json
```

### Interpreting the results
