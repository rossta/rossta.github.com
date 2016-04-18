---
title: Using Webpack with Middleman
author: Ross Kaffenberger
published: false
summary: Using Webpack with Middleman
description: Using Webpack with Middleman
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
---

I've [hosted this site on Github Pages](/blog/why-i-ditched-wordpress-for-github.html) with the [Middleman static site framework](https://middlemanapp.com/) for several years now. To keep up with the most recent release of the framework, I decided to [upgrade the site to Middleman version 4](https://middlemanapp.com/basics/upgrade-v4/). There were some significant changes to the configuration options and helper methods, which are [well documented](https://middlemanapp.com/basics/upgrade-v4/) on the Middleman blog.

By far the biggest change was the [removal of the Sprockets](https://middlemanapp.com/advanced/asset_pipeline/) dependency for the asset pipeline. Sprockets was originally a big selling point for me when choosing Middleman years ago. As a Rails developer, I had a lot of familiarity with the Sprockets style directives for bundling JavaScript and CSS assets and could use the pipeline to transpile CoffeeScript and SCSS easily.

Given the "explosion of front-end language and tooling" that has happened in the time since, Sprockets has fallen well-behind other solutions in terms of speed and flexibility among other things. With so many tools like Grunt, Gulp, Webpack, Browserify, Brunch, Brocolli&emdash;name a few&emdash;frameworks like Middleman can't possibly support custom integrations for everything. Instead the Sprockets asset pipeline has been replaced with the `external_pipeline` feature which allows Middleman to run "subprocesses" alongside the development server and build phase.

The Middleman team has taken a big risk in dropping support for the primary asset management solution for Rails developers, likely the primary maintainers of Middleman apps. I believe it was the right choice. As someone who has been through the upgrade process, I can confirm it was challenging, but I have seen how great the payoff can be.

In my opinion, if the Rails community wishes to stay relevant in the coming years, it would be wise to adopt a similar strategy: to "future proof" the rapidly changing front-end environment, Rails should drop Sprockets and embrace the external pipeline like Middleman.

- Middleman 4 introduces the external pipeline
  * Why?
  * How does this work?
- Before switch
  * rails-asset gems
- Minimal webpack setup
  * [middleman-guides](https://github.com/middleman/middleman-guides/blob/888b0a61107c17d5e1448b5860010590265ed5f0/webpack.config.js)
