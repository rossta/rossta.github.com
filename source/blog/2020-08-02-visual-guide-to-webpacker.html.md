---
title: A visual guide to Webpacker
author: Ross Kaffenberger
published: true
summary: How webpack and Rails work together in boxes and arrows
description: Navigate the world of Webpacker and webpack on Rails with confidence using this collection of mental maps I put together.
pull_image: 'blog/stock/ian-map-unsplash.jpg'
pull_image_caption: Photo by Ian on Unsplash
pull_image_link: https://unsplash.com/@travelsnips
series:
category: Code
tags:
  - Rails
  - Webpack
---

Confused about how Webpacker works in Rails? Let's unpack it with some diagrams.

Before we get to Webpacker, a quick word on how things look when requests are served with the Rails asset pipeline in development, as a comparison.

#### HTML request with the asset pipeline

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-asset-pipeline-1.png)

With the asset pipeline, when an HTML request is processed (1), bundling takes place within your Rails server (2). The asset pipeline is responsible for creating the bundled assets in the `public/assets/` directory and providing URLs to those assets to be rendered in the View.

```
<script src="/assets/application-3b2c...a7e.js">
```

> Note: Please consider the diagrams in this post as approximations of how the pieces fit together. Much of the detail has been omitted for simplicity and to draw attention to the salient aspects. For example, the browser does not get the response directly from the view as depicted above or from file server as in the following diagram; the actual request flow from these points is mostly irrelevant to the goal of this post.

#### Asset request with the asset pipeline

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-asset-pipeline-2.png)

Subsequently, the browser fetches that resource from your Rails server (1) where the `ActionDispatch::Static` middleware serves the asset from the `public/assets/` directory (2).

Good so far?

### Understanding Webpacker

With Webpacker, things work differently. Webpacker uses webpack to compile assets. Since webpack is written in JavaScript, not Ruby, and runs on the Node.js runtime, Rails can't interact with it the same way it could with Sprockets and the Rails asset pipeline.

Webpacker provides the glue to help Rails communicate with webpacker and locate the assets webpack produces. This "glue" includes

- webpack configuration,
  - i.e., `config/webpacker.yml` and `config/webpack/{production,development,test}.js`
- helpers,
  - e.g. `javascript_pack_tag` and `stylesheet_link_tag`
- executables,
  - i.e. `bin/webpack` and `bin/webpack-dev-server`
- and middleware

Webpacker supports two modes for using Webpacker in development:

- compile on demand
- dev server

### Compile on demand

Let's look at "compile on demand" first.

This mode is enabled when the `compile` option is set to `true` in `config/webpacker.yml`.

```yaml
development:
  compile: true
```

Here's how webpack fits into the picture.

#### HTML request with Webpacker compile

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-compile-1.png)

As it processes an HTML request (1), Rails will render the View, including "pack" tags such as the following:

```erb
<%= stylesheet_pack_tag 'application', media: 'all' %>

<%= javascript_pack_tag 'application' %>

<%= image_pack_tag('media/images/apple-touch-icon.png') %>
```

Rails must be able to determine the URL for webpack JS, CSS, and image assets.

To do so, the Rails server will run webpack in a child process if the compiled assets are missing or stale (2).

The webpack config used to invoke webpack, `config/webpack/development.js` merges settings from `config/webpacker.yml` and the config provided by the `@rails/webpacker` NPM package (3).

Executing webpack will generate assets in the `public/packs/` directory along with the important `manifest.json` (4).

The `manifest.json` file is the key communication point from webpack to Rails: it provides a simple mapping to look up asset paths from their canonical names.

```json
{
  "application.js": "/packs/js/application-7efac57c4de0539bb941.js",
  "application.css": "/packs/css/application-7526fd011c9ea132a45f.css",
  "media/images/apple-touch-icon.png": "/packs/media/images/apple-touch-icon-b8d7025d5da762a9c1dd30980f412c92.png"
}
```

Rails will read this file via the Webpacker view helpers to render the correct URL to the assets.

#### Asset request with Webpacker compile

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-compile-2.png)

Once the browser has received the HTML response, it must make additional request to retrieve the assets. In "compile-on-demand" mode, this is identical to the asset pipeline:

The `ActionDispatch::Static` middleware (2) locates the asset on the file system in the `public/` directory (2) which is returned to the browser, short-circuiting the rest of the Rails process.

In production, of course, the role of the middleware may likely be played instead by a web server, such as Nginx, and/or a CDN.

### Dev server

The "compile on-demand" mode is similar to using the Rails asset pipeline in that you need only run the Rails server explicitly to get started. In development, I prefer "dev server" mode. This approach involves using the `webpack-dev-server` as a standalone HTTP server to compile assets and serve asset requests. Advantages include auto-recompilation, live-reloading, and [hot module replacement](https://webpack.js.org/concepts/hot-module-replacement/).

Let's see how requests are processed in "dev server" mode.

#### HTML request with dev server

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-dev-server-1.png)

Using a tool like foreman or overmind, we can boot up both the Rails server and the webpack-dev-server with a single command using a Procfile such as:

```yaml
# Procfile.dev
rails: bin/rails server
webpack: bin/webpack-dev-server
```

We'll also set the `compile` option to `false` in `config/webpacker.yml`; Rails won't shell out to the webpack executable if it detects the dev-server is running.

```yaml
development:
  compile: false
```

When the dev-server boots up (1), it "pre-compiles" assets in memory, instead of writing them to disk, for performance. It does still write the `manifest.json` file to disk in the `public/packs/` directory (2), where Rails can find it.

As with the other examples, as the request (3) is processed, the View will attempt to render javascript, stylesheet, and image tags. Rails will determine asset URLs from `manifest.json` (4). If the webpack-dev-server is not running or hasn't finished compiling as the request comes in, you may see the infamous [Webpacker::Manifest::MissingEntryError](https://github.com/rails/webpacker/issues/1730).

#### Asset request with dev server

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-dev-server-2.png)

As before, Rails middleware (1) locates the asset, this time, by proxying to the webpack-dev-server (2).

Recall that with the asset pipeline or webpack "compile on demand", the `ActionDispatch::Static` middleware located the assets on the file system in the `public/` directory. However, when using the webpack-dev-server, assets on not written to disk, they're created in memory; `ActionDispatch::Static` doesn't work in this case.

To solve this problem, Webpacker provides its own middleware: `Webpacker::DevServerProxy` ([source](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/webpacker/dev_server_proxy.rb#L3)). This allows Rails to act as an intermediary between the browser and the webpack-dev-server in development.

> As a side note, if Rails output the local dev-server host in the asset URLs, say as `http://localhost:3035/packs/js/application...js` instead of just `/packs/js/application...js`, I don't think the proxy middleware would be necessary. I'm not entirely sure why they went this direction if only to make it seem more like the asset pipeline from the browser's perspective.

At times, Rails can feel like a black box. I hope these mental maps help make it easier to navigate the world of Webpacker and webpack on Rails with confidence.
