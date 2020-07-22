---
title: Why doesn't Webpacker use my test config when I run Rails tests?
author: Ross Kaffenberger
published: true
summary: Understanding how NODE_ENV is used with Webpacker
description: When running Rails system or integration tests, you might be surprised to learn that Webpacker will load your development webpack config. What's the deal?
pull_image: 'blog/stock/green-chameleon-testing-unsplash.jpg'
pull_image_caption: Photo by Green Chameleon
pull_image_link: "https://unsplash.com/s/photos/test?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
series:
category: Code
tags:
  - Rails
  - Webpack
---

Here's something you might not expect: when running Rails tests, Webpacker will load the _development_ webpack config instead of the test config by default.

To demonstrate, I'll use some "puts" debugging. Here's a `console.log` statement in the development config.
```javascript
// config/webpack/development.js
// ...
console.log('Loading config/webpack/development.js...')
```
When I run my RSpec tests while logging to STDOUT and RAILS_ENV set to test, the log line is displayed.
```sh
$ RAILS_LOG_TO_STDOUT=true RAILS_ENV=test bin/rspec

# ...
[Webpacker] Compiling...
# ...
[Webpacker] Loading config/webpack/development.js...
# ...
```
If you've noticed this before, you're not the only one; this is a [recently reported issue](https://github.com/rails/webpacker/issues/2654) on the Webpacker GitHub repository.

It turns out, even though RAILS_ENV is set to "test", NODE_ENV is set to 'development' ([source](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/bin/webpack#L4)). The webpack config use is determined by the NODE_ENV, which means, and this is especially pertinent to your Rails system and integration test, the development webpack config is loaded. (You can confirm this by setting NODE_ENV, i.e., `NODE_ENV=nonsense bin/webpack`).

### What gives?

If the "test" NODE_ENV isn't used when I run my Rails tests, what is it good for?

First, let's make it clear that NODE_ENV has no explicit relationship to RAILS_ENV. Setting one of the ENV variables will have no effect on the other.

This is useful for debugging; for example, you can compile your production webpack build locally:

```sh
NODE_ENV=production RAILS_ENV=development bin/rails s
```

Speaking of production, when running `rails assets:precompile` to compile your build, you don't have to set NODE_ENV to production explicitly because [Webpacker does this for you](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/tasks/webpacker/compile.rake#L21). Otherwise, development is the default.

Another key point the production and development configurations are designed for compiling your JS for a real browser. Though they have different optimization characteristics, [they share the same browser-focused Babel config](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/config/babel.config.js#L28-L38) which will transform your nice ES6+ syntax into JavaScript your supported browsers will understand.

### Test 1-2-3

This finally brings us to the use case for `NODE_ENV=test`:

_JavaScript unit testing_

By this I mean executing tests, written in JavaScript, against your application JavaScript code _within a Node.js process_.

We're talking [Mocha](https://github.com/mochajs/mocha), [Jest](https://github.com/facebook/jest), [Karma](https://karma-runner.github.io/latest/index.html), and more.

For some applications, JavaScript unit tests may not add much value, say if you're just doing a little DOM-manipulation with jQuery here and there. However, there may be some benefit to structuring your JavaScript utilities and components into discrete units which can be tested in isolation. And where there are discrete, testable units, there is room for unit testing. That's where JavaScript test runners come in.

The Rails unit testing for asset-pipeline compiled JavaScript is a bit cumbersome; it typically requires a gem, like [teaspoon](https://github.com/jejacks0n/teaspoon) or [jasmine-rails](https://github.com/searls/jasmine-rails), that integrates tightly with the Rails asset pipeline by booting up both Rails and a browser to compile JavaScript and execute tests.

Webpacker opens the door to JavaScript unit test runners that can run in a Node.js process instead of a real browser (typically for speed). Jest, for example, [executes tests against a "browser-like" environment called jsdom by default](https://jestjs.io/docs/en/configuration#testenvironment-string). To support these node.js test runners, Webpacker's [default Babel config targets the node.js runtime instead of a browser when `NODE_ENV=test`](https://github.com/rails/webpacker/blob/bf278f9787704ed0f78038ad7d36c008abc2edfd/lib/install/config/babel.config.js#L20-L27); this means Babel will transform your nice ES6+ syntax into JavaScript your current node version will understand assuming you set `NODE_ENV=test` for running your JavaScript unit tests.

You can see the potential problem then if you explicitly set `NODE_ENV=test` for your Rails system and integration tests without considering your Babel config; compiling your JavaScript for the Node.js runtime and loading in the browser may lead to some surprising issues. You can, of course, override this behavior if you really want; at least with this introduction provides some awareness of what you'd be getting yourself into.

### The more you know

You can [setup Jest to compile your JavaScript through your webpack configuration](https://jestjs.io/docs/en/webpack). If you follow the [general setup instructions for Jest](https://jestjs.io/docs/en/getting-started), it's possible to integrate to run your unit tests without webpack at all... meaning your test webpack config, specified by `config/webpack/test.js`, is useless. Other test runners like [karma](https://karma-runner.github.io/latest/index.html) offer similar options for running with or without webpack.

Also, as I've described previously in [Understanding webpacker.yml](/blog/how-to-use-webpacker-yml.html), Webpacker provides a webpack configuration while merging settings declared in `config/webpacker.yml` from YAML to JavaScript. This file contains settings for production, development, and test environments as do most Rails-y YAML files. Unlike the webpack config, webpacker.yml settings are determined by the current RAILS_ENV.

This means, webpacker.yml test settings are merged into the development webpack config when running your Rails tests.

### Wrapping up

Does all of this seem a little confusing? I agree. Here's a breakdown of how webpack configuration maps to RAILS_ENV and NODE_ENV in various contexts.

<table style="font-size:85%; margin-bottom: 2em;">
  <thead>
    <tr style="border-bottom: 1px solid #CCC">
      <th>Mode</th>
      <th>RAILS_ENV</th>
      <th>webpacker.yml</th>
      <th>NODE_ENV</th>
      <th>webpack config</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #CCC">
      <td>Deployed app</td>
      <td>production</td>
      <td>production</td>
      <td>production</td>
      <td>config/webpack/production.js</td>
    </tr>
    <tr style="border-bottom: 1px solid #CCC">
      <td>Local server</td>
      <td>development</td>
      <td>development</td>
      <td>development</td>
      <td>config/webpack/development.js</td>
    </tr>
    <tr style="border-bottom: 1px solid #CCC">
      <td>Rails tests</td>
      <td>test</td>
      <td>test</td>
      <td>development</td>
      <td>config/webpack/development.js</td>
    </tr>
    <tr style="border-bottom: 1px solid #CCC">
      <td>JS unit tests</td>
      <td>n/a</td>
      <td>test</td>
      <td>n/a</td>
      <td>config/webpack/test.js</td>
    </tr>
  </tbody>
</table>

Stated more simply:

RAILS_ENV determines which Webpacker YAML settings are used and NODE_ENV determines which webpack configuration is used.

Whether or not you find the use case for JavaScript unit tests compelling, it helps to know that Webpacker does not make any distinction between your development and test environments beyond the settings in your webpacker.yml; both are local concerns that target the same runtime, i.e., the browser.

---

If you found this helpful, please consider subscribing to my newsletter to stay tuned for more on upping your "JavaScript on Rails" game.
