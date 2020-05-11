---
title: Why does Rails 6 include both Webpacker and Sprockets?
author: Ross Kaffenberger
published: false
summary: "Spoiler: Because DHH says so… but you can still choose"
description: Why does Rails install both Webpacker and Sprockets
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
pull_image_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
---

I know why you're here. Things have gotten a little confusing lately. Rails 6 is getting more complex. It's [a May of WTFs](https://weblog.rubyonrails.org/2020/5/7/A-May-of-WTFs/). Among other things, you've heard Rails 6 installs both Webpacker and Sprockets.

*Wait, don't they do basically the same thing?*

You're not alone.

The question keeps coming up, like in this [Reddit post](https://www.reddit.com/r/rails/comments/9zg7fe/confused_about_the_difference_between_sprockets/), or this [StackOverflow question](https://stackoverflow.com/questions/55232591/rails-5-2-why-still-use-assets-pipeline-with-webpacker), or this [other Reddit post](https://www.reddit.com/r/rails/comments/dfww82/best_practice_for_webpacker_in_rails_6_do_i_need/). Even [@avdi](https://twitter.com/avdi) just last week:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Will someone please explain to me why after all the foofaraw about Rails 6 going to webpack, I&#39;m still having to unfuck Sprockets in my application.rb</p>&mdash; Avdi Grimm (@avdi) <a href="https://twitter.com/avdi/status/1256742291890413570?ref_src=twsrc%5Etfw">May 3, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

It's clear that many are surprised by the co-existence. There's good reason for that too. You wouldn't be wrong to think Sprockets and webpack solve the same general problem: packaging assets (like JavaScript, CSS, images, and fonts) for the browser.

The similarities go deeper. Both Sprockets and webpack will:

* combine many source files into one or a few destination bundles for production
* transpile source files from one syntax to another
* minify and fingerprint assets when building for production
* rebuild modified source files in development incrementally
* do all of the above for both JavaScript and CSS

Despite these similarities, Sprockets and webpack implement these problems in very different ways. Sprockets was introduced way back in 2007 (!), before Node.js, before the Cambrian explosion of JavaScript, before module specifications like CommonJS, AMD, and EcmaScript modules, before webpack, browserify and $ANY_MODULE_AWARE_ASSET_BUNDLER. Sprockets has never embraced truly embraced what's now taken for granted in the JavaScript community.

Webpack, on the other hand, fully embraces the concept of JavaScript modules. It supports a number of module syntaxes, including dynamic imports for code splitting. It's also extremely modular and customizable.

So why would Rails include both? Here's the answer plain and simple straight from @dhh himself back in 2016 when Webpack was first introduced as the recommended JavaScript compiler with Rails 5.1.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">We will continue to use the asset pipeline for JavaScript sprinkles, CSS, images, and other static stuff. The two approaches coexist great.</p>&mdash; DHH (@dhh) <a href="https://twitter.com/dhh/status/808349072734027776?ref_src=twsrc%5Etfw">December 12, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

To elaborate on this decision, there was a telling response from DHH on his GitHub pull request to [make Webpacker the default JavaScript compiler in Rails 6](https://github.com/rails/rails/pull/33079#issuecomment-400140840)

[![DHH: Webpack’s support is awkward in my opinion and does not offer any benefits over Sprockets. Unlike in the realm of JavaScript compilation.](blog/webpack/dhh-awkward.png)](https://github.com/rails/rails/pull/33079#issuecomment-400140840)

> **@dwightwatson** Out of curiousity, what is the argument to continue using Sprockets for CSS/static assets when Webpacker supports them by default out of the box?

> **@dhh** Webpack’s support is awkward in my opinion and does not offer any benefits over Sprockets. Unlike in the realm of JavaScript compilation.

Ok, there's a lot to unpack there.

When it comes to asset bundling, the "Rails way" is webpack for JavaScript and Sprockets for everything else. The default setup in a fresh Rail 6 install, similar to what Basecamp uses, still compiles CSS, images, and fonts with Sprockets.

This means, if you're a member of the Basecamp camp, all your webpack JavaScript source files would live in `app/javascript` and all your Sprockets CSS and images would remain in `app/assets`.

DHH calls webpack's approach to handling non-JavaScript assets *awkward*. Now, I happen to like webpack a lot. But he's not wrong.

The reason he says this stems from the fact that webpack wants to treat **everything** as a JavaScript module. I mean everything.

To use CSS with webpack, you import it as you would a JavaScript module. To use an image with webpack, you import it as you would a JavaScript module. Depending on your perspective, this is surprising—I think especially for "occasional frontend" Rails developers.

Perhaps they're not the only ones. Consider this recent tweet from a prominent voice in the React community, [@ryanflorence](https://twitter.com/ryanflorence):

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">import url from &quot;./whatever.jpg&quot;<br>import html from &quot;./some.md&quot;<br>import str from &quot;raw!./some.js&quot;<br><br>So ... I gotta admit I love this stuff, but did we jump the shark here with JavaScript build tools? Should this stuff happen outside the JavaScript module bundler?</p>&mdash; Ryan Florence (@ryanflorence) <a href="https://twitter.com/ryanflorence/status/1258966331572928514?ref_src=twsrc%5Etfw">May 9, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Sounds a lot like discovering Sprockets in reverse.

What should you do then? Personally, I want to leave Sprockets behind. It languishes while webpack's key features, such as performance optimizations through code-splitting, are first class. Though awkward to some, webpack's "everything is a module" mindset is also extremely powerful. There are some interesting possibilities when a tool goes "all in" with such a mental model. Think of what "everything is an object" has done for Ruby.

### Why Sprockets?

* My Rails app does not need much JavaScript
* I prefer using global scripts and jQuery plugin enhancement
* Upgrading my legacy Rails app would be too costly

### Why not Sprockets?

* I prefer to
* Sprockets is slowing down my local development experience
* I want more control over the build process
* If I need to use node packages that are not common enough to be 'gemified' or simple enough to be included as vendored JS

### Why Webpacker?

If I need to use node packages
If I want to build Single Page Apps
If I would prefer to modify my asset build process in the same language I build it
If I have assets outside of Rails
If I want the latest ES6 or Babel features
leverage npm modules
limit global scope pollution and have an explicit dependency tree with import/export and require
generate source maps (for more useful stack traces)
customize es2015 transpile settings and upgrade to babel 6
implement hot module replacement in development
fine tune all aspects of our asset compilation in ways that sprockets falls short

### Why not Webpacker?

You have a simple rails app that doesn't need advanced JS features
If I am a backend developer with limited knowledge of JS ecosystem

### Why use both?
