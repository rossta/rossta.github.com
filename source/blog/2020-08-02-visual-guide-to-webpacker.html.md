---
title: A visual guide to Webpacker
author: Ross Kaffenberger
published: true
summary: How webpack and Rails work together in boxes and arrows
description: Navigate the world of Webpacker and webpack on Rails with confidence using this collection of mental maps I put together.
thumbnail: 'blog/stock/ian-map-unsplash.jpg'
thumbnail_caption: Photo by Ian on Unsplash
thumbnail_link: https://unsplash.com/@travelsnips
series:
category: Code
tags:
  - Rails
  - Webpack
type: Feature
---

Confused about how Webpacker works in Rails? Let's unpack it with some diagrams.

First, we'll take a look at the "classic" way of bundling assets with Rails: the Rails asset pipeline. Let's see how things look when requests are served with the Rails asset pipeline in development.

> Struggling with webpack and Webpacker?
>
> [**Subscribe to my newsletter for occasional emails with new content.**](/webpack-on-rails/).

#### HTML request with the asset pipeline

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-asset-pipeline-1.png)

With the asset pipeline, when an HTML request is processed (1), bundling takes place within your Rails server (2). The asset pipeline is responsible for creating the bundled assets in the `public/assets/` directory and providing URLs to those assets to be rendered in the View.

```
<script src="/assets/application-3b2c...a7e.js">
```

> Note: Please consider the diagrams in this post as approximations of how the pieces fit together. Much of the detail has been omitted for simplicity and to draw attention to the salient aspects.

#### Asset request with the asset pipeline

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-asset-pipeline-2.png)

As the browser parses the HTML response and finds that script tag, it must make an additional request to fetch the linked JavaScript resource from your Rails server. This time, the request is processed by (1) the `ActionDispatch::Static` middleware, which recognizes the asset lives on disk in the `public/assets/` directory (2).

Good so far?

### Understanding Webpacker

With Webpacker, things work differently.

While the Rails asset pipeline lives _within_ the Rails server process, webpack, as you may know, is written in JavaScript and executes within the Node.js runtime. Therefore, webpack must run in a separate process.

Rails needs some "glue" to help it communicate with webpack. Webpacker provides the glue, which includes:

- webpack configuration,
  - i.e., `config/webpacker.yml` and `config/webpack/{production,development,test}.js`
- helpers,
  - e.g. `javascript_pack_tag` and `stylesheet_link_tag`
- executables,
  - i.e. `bin/webpack` and `bin/webpack-dev-server`
- and middleware for development
  - i.e., `Webpacker::DevServerProxy`

For the purpose of illustration, we'll focus on how Webpacker works in development. Webpacker supports two development "modes":

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

The `ActionDispatch::Static` middleware (1) locates the asset on the file system in the `public/` directory (2) which is returned to the browser, short-circuiting the rest of the Rails process.

In production, of course, the role of the middleware may likely be played instead by a web server, such as Nginx, and/or a CDN.

### Dev server

The "compile on-demand" mode is similar to using the Rails asset pipeline in that you need only run the Rails server explicitly to get started. In development, I prefer "dev server" mode. This approach involves using the `webpack-dev-server` as a standalone HTTP server to compile assets and serve asset requests. Advantages include auto-recompilation, live-reloading, and [hot module replacement](https://webpack.js.org/concepts/hot-module-replacement/).

Using a tool like [foreman](https://github.com/ddollar/foreman) or [overmind](https://github.com/DarthSim/overmind), we can boot up both the Rails server and the webpack-dev-server with a single command using a Procfile such as:

```yaml
# Procfile.dev
rails: bin/rails server
webpack: bin/webpack-dev-server
```

We'll also set the `compile` option to `false` in `config/webpacker.yml`.

```yaml
development:
  compile: false
```

This way, Rails won't shell out to the webpack executable if the dev-server is running. The dev-server will be responsible for detecting changes to assets and recompiling automatically.

Let's see how requests are processed in "dev server" mode.

#### HTML request with dev server

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-dev-server-1.png)

When the dev-server boots up (1), it "pre-compiles" assets in memory, instead of writing them to disk, for performance. It does still write the `manifest.json` file to disk in the `public/packs/` directory (2), where Rails can find it.

As with the other examples, as the request (3) is processed, the View will attempt to render javascript, stylesheet, and image tags. Rails will determine asset URLs from `manifest.json` (4). If the webpack-dev-server is not running or hasn't finished compiling as the request comes in, you may see the infamous [Webpacker::Manifest::MissingEntryError](https://github.com/rails/webpacker/issues/1730).

#### Asset request with dev server

![Rails request with the asset pipeline](blog/visual-guide-to-webpacker/webpacker-dev-server-2.png)

As before, Rails middleware (1) locates the asset, this time, by proxying to the webpack-dev-server (2).

Recall that with the asset pipeline or webpack "compile on demand", the `ActionDispatch::Static` middleware located the assets on the file system in the `public/` directory. However, when using the webpack-dev-server, assets on not written to disk, they're created in memory; `ActionDispatch::Static` doesn't work in this case.

To solve this problem, Webpacker provides its own middleware: `Webpacker::DevServerProxy` ([source](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/webpacker/dev_server_proxy.rb#L3)). This allows Rails to act as an intermediary between the browser and the webpack-dev-server in development.

> As a side note, I'm not entirely sure why the proxy middleware would be necessary. Rails could point asset urls directly at webpack-dev-server by prepending the host, i.e., `http://localhost:3035/...`. Instead, by default in development, asset paths are produced so that the browser will direct its assets requests to the Rails server. I'm not entirely sure why the maintainers went this direction if only to make it seem more like the asset pipeline from the browser's perspective.

### Wrapping up

At times, Rails can feel like a black box. I hope these mental maps help make it easier to navigate the world of Webpacker and webpack on Rails with confidence.
