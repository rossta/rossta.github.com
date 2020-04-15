---
title: 5 Tips for Debugging Webpack
author: Ross Kaffenberger
published: false
summary: Webpack debugging tips
description: Webpack debugging tips
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
pull_image_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

1. Add the bundle analyzer

1. $ node -e 'console.dir(require("./config/webpack/development"), { depth: null })'

1. $ bin/webpack --debug + chrome://inspect

1. $ bin/webpack --json -p | webpack-bundle-size-analyzer

1. speed-measure-webpack-plugin

process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const environment = require('./environment')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap(environment.toWebpackConfig())
