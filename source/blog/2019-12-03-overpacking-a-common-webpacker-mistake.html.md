---
title: 'Overpacking: A Common Webpacker Mistake'
author: Ross Kaffenberger
published: true
summary: i.e., How I saved 6 minutes in a Rails team's deploy time
description: A tutorial to help introduce how to properly use entry points files, called packs, with Webpacker and Rails
pull_image: 'blog/stock/brandless-packing-unsplash.jpg'
pull_image_caption: Photo by Brandless on Unsplash
series:
category: Code
tags:
  - Webpack
  - Rails
---

I recently encountered a Rails app at work that was spending nearly seven minutes precompiling assets:

![CI Screenshot: Precompile assets, 6:56](blog/webpack/overpack-before-fix.png)

I looked in the `Gemfile` and found the project was using Webpacker. My spidey sense started to tingle.

*I've seen this before*.

Leaning on prior experience, I found the problem, moved some files around, and pushed a branch with the fix up to CI.

![CI Screenshot: Precompile assets, 0:44](blog/webpack/overpack-after-fix.png)

The build step dropped from nearly seven minutes to less than one. Big improvement! When I heard from the team, the fix also greatly improved the local development experience; before, re-compiling Webpack assets on page refreshes would take a painfully long time.

So what were the changes?

### A Common Problem

First, let's take a step back. If you're new to Webpack and Webpacker for Rails, chances are you may be making some simple mistakes.

I know this because I was once in your shoes struggling to learn how Webpack works. I've also spent a lot of time helping others on my team, on StackOverflow, and via [`rails/webpacker`](https://github.com/rails/webpacker) Github issues.

One of the most frequently-reported issues I've seen is slow build times. This is often coupled with high memory and CPU usage. For Heroku users on small dynos, resource-intensive asset precompilation can lead to failed deploys.

More often than not, the root cause is a simple oversight in directory structure—a mistake I call "overpacking".

### Overpacking explained

Here's the layout of the `app/javascript` directory in the Rails app *before* I introduced the fix:

**rake assets:precompile — 6:56**
```shell
app/
  javascript/
    packs/
      application.js
      components/     # lots of files
      images/         # lots of files
      stylesheets/    # lots of files
      ...
```

Here's what the project looked like building in under a minute:

**rake assets:precompile — 0:44**
```shell
app/
  javascript/
    components/
    images/
    stylesheets/
    ...
    packs/
      application.js    # just one file in packs/
```

See the difference?

The primary change here was moving everything except `application.js` outside of the `packs` directory under `app/javascript`. (To make this work properly, I also had to update some relative paths in `import` statements.)

### Webpack Entry Points

So why did this matter?

Webpack needs at least one **entry** point to build the dependency graph for produce the JavaScript and CSS bundles and static assets (images, fonts, etc).

> The Webpacker project refers to entries as **packs**.

"Entry" is listed as the first key concept on Webpack's documentation site: https://webpack.js.org/concepts/#entry.

Webpack will build a separate dependency graph for every entry specified in its configuration. The more entry points you provide, the more dependency graphs Webpack has to build.

Since Webpack*er*, by default, treats *every file* in the `packs` directory as a separate entry, it will build a separate dependency graph for *every file* located there.

That also means, for *every file* in the `packs` directory, there will be at least one, possibly more, files emitted as output in the `public` directory during precompilation. If you're not linking to these files anywhere in your app, then they don't need to be emitted as output. For a large project, that could be lot of unnecessary work.

Here's a case where Rails tries to make things easier for you—by auto-configuring entry files—while also making it easier to shoot yourself in the foot.

### A Simple Rule

Is your Webpacker compilation taking forever? You may be overpacking.

> If any file in Webpacker's "packs" directory does not also have a corresponding `javascript_pack_tag` in your application, then you're overpacking.

Be good to yourself and your development and deployment experience by being very intentional about what files you put in your "packs" directory.

Don't overpack. At best, this is wasteful; at worst, this is a productivity killer.