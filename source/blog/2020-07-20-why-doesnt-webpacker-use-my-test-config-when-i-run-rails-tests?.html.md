---
title: Why doesn't Webpacker use my test config when I run Rails tests?
author: Ross Kaffenberger
published: false
summary: Why doesnt Webpacker use my test config when I run Rails tests?
description: Why doesnt Webpacker use my test config when I run Rails tests?
pull_image: 'blog/stock/green-chameleon-testing-unsplash.jpg'
pull_image_caption: Photo by Green Chameleon
pull_image_link: "https://unsplash.com/s/photos/test?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
series:
category: Code
tags:
  - Rails
---

When running Rails tests, by default, the Webpacker config specified by `config/webpack/development.js` will be loaded.

```javascript
// config/webpack/development.js
// ...
console.log('Loading config/webpack/development.js...')
```
```sh
$ RAILS_LOG_TO_STDOUT=true bin/rspec

# ...
[Webpacker] Compiling...
# ...
[Webpacker] Loading config/webpack/development.js...
# ...
```

What the ...?!

It turns out, by default, NODE_ENV is set to [set to `'development'`](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/bin/webpack#L4). It is the `NODE_ENV` that determines which webpack config is loaded. (You can confirm this by setting NODE_ENV, i.e., `NODE_ENV=nonsense bin/webpack`).

Ok, so why?

First, let's make it clear that NODE_ENV has no explicit relationship to RAILS_ENV. Setting one of the ENV variables will have no effect on the other.

This is useful for debugging; for example, you can compile your production webpack build locally by running `NODE_ENV=production bin/rails s`. The reason you don't have to set `NODE_ENV` when you run `rails assets:precompile` is that [Webpacker does this for you](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/tasks/webpacker/compile.rake#L21).

Another key point the production and development configurations are designed for compiling your JS for a real browser. Though they have different optimization characteristics, [they share the same browser-focused Babel config](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/config/babel.config.js#L28-L38) which will transform your nice ES6+ syntax into JavaScript your supported browsers will understand.

So what's `NODE_ENV=test` good for? The answer is _JavaScript unit testing_. JavaScript unit test runners these days can _run in a node.js process_ instead of a real browser (typically for speed). [Jest](https://jestjs.io/), for example, [executes tests against a "browser-like" environment called jsdom by default](https://jestjs.io/docs/en/configuration#testenvironment-string). Webpacker provides for this in the [default Babel config by targeting node.js instead of a browser for Babel transforms when `NODE_ENV=test`](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/config/babel.config.js#L20-L27); in this case, Babel will transform your nice ES6+ syntax into JavaScript your current node version will understand.

You can see the potential problem then if you explicitly set `NODE_ENV=test` for your Rails system and integration tests without considering your Babel config. You can, of course, override this behavior if you really want; hopefully, this introduction provides some awareness of what you'd be getting yourself into.
