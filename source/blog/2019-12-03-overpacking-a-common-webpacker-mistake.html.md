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

When I found that the project was using Webpacker, my spidey sense started to tingle.

*I've seen this before*.

Leaning on prior experience, I found the problem, moved some files around, and pushed a branch with the fix up to CI.

![CI Screenshot: Precompile assets, 0:44](blog/webpack/overpack-after-fix.png)

Big improvement!

### A Common Problem

If you're new to Webpack and Webpacker for Rails, chances are you may be making some simple mistakes.

I know this because I was once in your shoes struggling to learn how Webpack works and I've also spent a lot of time helping others on my team, on StackOverflow, and through Github issues on the rails/webpacker project.

One of the most frequently-reported issues I've seen is slow build times to go along with high memory and CPU usage. For Heroku users on small dynos, this often leads to failed deploys.

More often than not, the root cause is a simple mistake in directory structure, which I call "overpacking".

### Overpacking explained

Here's the layout of the `app/javascript` directory in the Rails app *before* I introduced the fix:

**rake assets:precompile — 6:56**
```shell
app/
  javascript/
    packs/
      application.js
      components/
      images/
      stylesheets/
      ...
```

Here's what the project looked like building in under a minute:

***rake assets:precompile — 0:44***
```shell
app/
  javascript/
    components/
    images/
    stylesheets/
    ...
    packs/
      application.js    # limit your entries/packs!
```

See the difference?

The primary change here was moving everything expect `application.js` outside of the `packs` directory under `app/javascript`. I also had updated paths for `import` statements within `app/javascript/packs/application.js` to the appropriate location.

### Webpack Entry Points

So why did this matter?

Webpack needs at least one **entry** point to build the dependency graph for produce the JavaScript and CSS bundles and static assets (images, fonts, etc).

> The Webpacker project refers to entries as **packs**.

It will build a separate dependency graph for every entry specified in its configuration. The more entry points you provide, the more dependency graphs Webpack has to build.

Since WebpackER, by defaults, treats *every file* in the `packs` directory as a separate entry, it will build a separate dependency graph for *every file* located there.

That also means, for *every file* in the `packs` directory, there will be at least one, possibly more, files emitted as output in the `public` directory during precompilation. If you're not linking to these files anywhere in your app, then they don't need to be emitted as output.

For a large project, that could be lot of unnecessary work.

### A Simple Rule

Is your Webpacker compilation taking forever? You may be overpacking.

Your project may very well need more than one entry besides the typical `application.js`. However, treating every module in your application as an entry is most likely a mistake.

> Don't overpack. At best, this is wasteful; at worst, this is a productivity killer.

Be good to yourself and stick to this rule: **one entry per page**.
