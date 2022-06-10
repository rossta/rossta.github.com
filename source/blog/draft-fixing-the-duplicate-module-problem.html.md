---
title: Fixing the duplicate module problem
author: Ross Kaffenberger
published: false
summary: Fixing the duplicate module problem
description: Fixing the duplicate module problem
thumbnail: 'blog/stock/louvre-pexels-photo.jpg'
thumbnail_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
---

## The Solution

So what can we do? How do we avoid this problem? What follows is some practical advice on how I would fix the duplicate module problem. This will be driven by example in which I optimize a demo app based off one of Podia's pages we highlighted earlier. All of the tools described below can be easily applied to any of the other Rails application, including your own.

### Optimizing Podia's storefront editor

The code snippets here can be found on Github at [rossta/rails6-webpacker-demo](TODO link) in the `example/podia-overpacking` branch.

https://github.com/rossta/rails6-webpacker-demo/compare/example/podia-overpacking

We start with a minimal Rails app and will through a few changesets which I'll note with a git SHA and link to the commit.

### 1. Baseline

Changeset: https://github.com/rossta/rails6-webpacker-demo/commit/f8bf1cd8fa46103abeb7a0d9048253f192818f46?short_path=754f6b2#diff-754f6b2109a834ecaca6a0893167ecf5

Here we've create a baseline changeset to reproduce the duplicate module problem in similar fashion to Podia's storefront editor page. I won't attempt to replicate the functionality, but I'll pull many of the same packages across multiple packs.

This commit leaves us with three packs. Note that the presence of application.js and application.scss is considered one pack called "application" as of Webpacker v5:

```
$ tree app/javascript/packs
app/javascript/packs
├── application.js
├── application.scss
├── timeago.js
└── welcome.js
```

These packs import modules from packages like `moment`, `stimulus`, and `@rails/actioncable`. Rather than list out all the source code, you can visualize the imports using the output from the webpack-bundle-analyzer for this commit

![Bundle-analyzer treemap with duplicate modules](blog/overpacking-case-studies/duplicate-modules-stats-optimized.png)

### 2. Refactor with dynamic imports

Changeset: https://github.com/rossta/rails6-webpacker-demo/commit/7d7d6264426878787e2d321bf3adb886d52c6e90?short_path=9e132f0#diff-9e132f03cb40053cb66974b50518d507

Refactoring to dynamic imports with pages and initializers

<%= Gon::Base.render_data %>

<script>
//<![CDATA[
window.gon={};gon.pages=["welcome"];
//]]>
</script>

![Bundle-analyzer treemap with dynamic imports](blog/overpacking-case-studies/dynamic-imports-stats-optimized.png)

### 3. Ignore unnecessary moment locales

Changeset: https://github.com/rossta/rails6-webpacker-demo/commit/47241701577c3864f8cf2f19bdac84908c550093?short_path=512191e#diff-512191e5ecd9be5119215329e8442e3a

Commit: 059058a
Ignoring moment locales

```javascript
const { environment } = require('@rails/webpacker')
const webpack = require('webpack')

environment.plugins.append(
  'IgnoreMomentLocales',
  new webpack.ContextReplacementPlugin(
    /moment[/\\]locale$/,
    /(en-us|en-gb)/,
  ),
)
```

![Bundle-analyzer treemap with moment locales ignored](blog/overpacking-case-studies/ignore-moment-locales-stats-optimized.png)

### 4. Enable the "splitChunks" optimization

Changset: https://github.com/rossta/rails6-webpacker-demo/commit/f685ceca5b53546e1615dd9f61dfbd1805aaa4b0?short_path=9b1bee5#diff-9b1bee514e4f6f042737198f86bf9896

The next step in the webpack optimization journey is to use [the splitChunks configuration API](https://help.github.com/en/github/managing-files-in-a-repository/getting-permanent-links-to-files) to split out bundles for vendor code that can be shared across packs. In other words, browsers wouldn't have to pay the cost of re-downloading bundles containing moment.js, lodash.js, etc., across multiple pages with a warm cache.

I won't go into too much detail about this API, which provides a number of options to play with, but it's easy enough to [enable it through the Webpacker config](https://github.com/rails/webpacker/blob/master/docs/webpack.md#add-splitchunks-webpack-v4):

```javascript
environment.splitChunks((config) => {
  return {
    ...config,
    ...{
      optimization: {
        runtimeChunk: 'single',
      },
    },
  }
})
```

```html
<%= javascript_packs_with_chunks_tag 'application' %>
<script src="/packs/js/runtime~application-7c7f8f4da27353dce15d.js"></script>
<script src="/packs/js/vendors~application-04bdba7d463b54124aa6.chunk.js"></script>
<script src="/packs/js/application-fe887f69b6ce75f78b20.chunk.js"></script>
```

The result might looks something like this:
![Bundle analyzer treemap with splitChunks optimization](blog/overpacking-case-studies/split-chunks-stats-optimized.png)

Let's assume you've got your head wrapped around the problem... how do you solve it? For a multi-page application, [webpack recommends](https://webpack.js.org/concepts/entry-points/#multi-page-application) the [splitChunks optimization](https://webpack.js.org/plugins/split-chunks-plugin/).

```js
environment.splitChunks()
```

Notice it created _more bundles_ without the duplication. To correctly render a given page, there are some "vendor" packs and some shared bundles that webpack spits out to go with your explicit entry points. This is why the splitChunks optimization requires separate view helpers for rendering the javascript and stylesheet tags, e.g. https://github.com/rails/webpacker/blob/22ab02b7c84e917f985ecc76f5916d144f43bfbf/lib/webpacker/helper.rb#L102-L104

Webpack does the splitting in away so that the modules can be shared across bundles. Your application will now render _more_ bundles at a reduced cost across multiple pages (and even more so in a single page if your CDN provider has HTTP/2 enabled).

Beware though, this technique is a bit more advanced. It requires the use of separate Rails helpers, `javascript_packs_with_chunks_tag` and `stylesheet_packs_with_chunks_tag` which will output multiple bundles produced from a single pack and these helpers should only be used once during the page render. It may take some [reading up on the webpack docs](https://webpack.js.org/plugins/split-chunks-plugin/) and some experimentation with the chunking logic to achieve optimal results.

### 5. Only then, if necessary, revisit multiple packs per page

Commit: https://github.com/rossta/rails6-webpacker-demo/commit/c13a7bf002ebab66ec1c111915bc0898fc318a00?short_path=7e38b02#diff-7e38b02a26269ec3ffe158d38c5c493c
Multiple packs with split chunks

```html
<%= javascript_packs_with_chunks_tag "application", "welcome" %>
<script src="/packs/js/runtime-e286e4ca3b88c69b473f.js"></script>
<script src="/packs/js/vendors~application~welcome-98f508416b8ba6b66d62.chunk.js"></script>
<script src="/packs/js/vendors~application-1c7a4ba8dc1716143987.chunk.js"></script>
<script src="/packs/js/application-8d58c7b893b6b1951a2e.chunk.js"></script>
<script src="/packs/js/welcome-fb37443e0ecdb8bb2456.chunk.js"></script>
```

The result might looks something like this:
![Bundle analyzer treemap with splitChunks optimization and multiple packs](blog/overpacking-case-studies/multiple-packs-split-chunks-stats-optimized.png)

## Summing up

Webpack can be a bit confusing to understand at first and Webpacker goes a long way toward providing that "conceptual compression" to get developers up-and-running with webpack on Rails. Unfortunately, Webpacker doesn't yet provide the all the guard rails we need to avoid problems like overpacking.

Embracing new tools may mean a little more investment along with letting go of the way we used to do things. Applying the techniques described here can help ensure both a good experience for clients, who want faster web pages, and for developers, who want faster builds and fewer bugs.
