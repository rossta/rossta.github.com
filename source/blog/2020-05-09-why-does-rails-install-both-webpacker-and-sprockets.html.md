---
title: Why does Rails 6 include both Webpacker and Sprockets?
author: Ross Kaffenberger
published: true
summary: "Spoiler: Because DHH says so… but you can still choose"
description: A new Rails 6 application will install both Webpacker and Sprockets by default. Don't they solve the same problem? This article dives into why Sprockets lives on even though webpack has surpassed most of its features and why you might want to choose one over the other.
pull_image: 'blog/stock/julian-ebert-farmland-unsplash.jpg'
pull_image_caption: Photo by Julian Ebert on Unsplash
series:
popular: 1
category: Code
tags:
  - Rails
  - Webpack
---

Since you're reading this post, chances are you've heard Rails 6 installs both Webpacker and Sprockets and you're wondering WTF is going on. By the way, it's [a whole May of WTFs for Rails](https://weblog.rubyonrails.org/2020/5/7/A-May-of-WTFs/).

**Wait, don't Sprockets and Webpacker basically do the same thing?**

If this is what you're thinking, you're not alone.

> Curious about or need help with webpack? I may be able to help! I'm developing a course for Webpack on Rails and I frequently write about it on this blog.
>
> [**Subscribe to my newsletter to get updates**](https://little-fog-6985.ck.page/9c5bc129d8).

The question keeps coming up, like in this [Reddit post](https://www.reddit.com/r/rails/comments/9zg7fe/confused_about_the_difference_between_sprockets/), or this [StackOverflow question](https://stackoverflow.com/questions/55232591/rails-5-2-why-still-use-assets-pipeline-with-webpacker), or this [other Reddit post](https://www.reddit.com/r/rails/comments/dfww82/best_practice_for_webpacker_in_rails_6_do_i_need/).

Here's my colleague [@danmayer](https://twitter.com/danmayer):

<blockquote class="twitter-tweet" data-conversation="none"><p lang="en" dir="ltr">How and where to handle assets is in a confusing state, 1 foot in asset pipeline and one foot in webpacker... If that is going to be a long last direction vs a transition we should make the best practices more clear in guides and how to ensure they play nicely together</p>&mdash; Dan Mayer (@danmayer) <a href="https://twitter.com/danmayer/status/1258577270760804353?ref_src=twsrc%5Etfw">May 8, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Even [@avdi](https://twitter.com/avdi) just last week:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Will someone please explain to me why after all the foofaraw about Rails 6 going to webpack, I&#39;m still having to unfuck Sprockets in my application.rb</p>&mdash; Avdi Grimm (@avdi) <a href="https://twitter.com/avdi/status/1256742291890413570?ref_src=twsrc%5Etfw">May 3, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

It's clear the Webpacker-Sprockets co-existence is catching many by surprise. There's good reason for that too.

You wouldn't be wrong to think Sprockets and webpack solve the same general problem:

_Packaging assets (JavaScript, CSS, images, fonts) for the browser_

The similarities exist. Both Sprockets and webpack will:

* combine many source files into one or a few destination bundles for production
* transpile source files from one syntax to another
* minify and fingerprint assets when building for production
* rebuild modified source files in development incrementally
* do all of the above for both JavaScript and CSS

However, Sprockets and webpack solve asset bundling in very different ways.

Sprockets was introduced way back in 2007 (!), before Node.js, before the Cambrian explosion of JavaScript, before module specifications like CommonJS, AMD, and EcmaScript modules, before webpack, browserify and $ANY_MODULE_AWARE_ASSET_BUNDLER. Sprockets has not attempted to keep up with improvements in tooling, language features, and browser capabilities (save for source maps) as other projects in JavaScript community have.

Webpack, on the other hand, fully embraces the concept of JavaScript modules. It integrates with Babel, PostCSS, and just about any recent web framework. It supports a number of module syntaxes, including [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports) for [code splitting](https://webpack.js.org/guides/code-splitting/). There are a wide variety of [configurable source map options](https://webpack.js.org/configuration/devtool/). Top to bottom, the webpack compilation process is extremely modular and customizable.

### So why would Rails include both?

Here's the answer plain and simple straight from DHH back in 2016 when Webpack was first introduced as the recommended JavaScript compiler with Rails 5.1.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">We will continue to use the asset pipeline for JavaScript sprinkles, CSS, images, and other static stuff. The two approaches coexist great.</p>&mdash; DHH (@dhh) <a href="https://twitter.com/dhh/status/808349072734027776?ref_src=twsrc%5Etfw">December 12, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

> We will continue to use the asset pipeline for JavaScript sprinkles, CSS, images, and other static stuff. The two approaches coexist great.

To elaborate on this decision, there was a telling response from DHH on his GitHub pull request to [make Webpacker the default JavaScript compiler in Rails 6](https://github.com/rails/rails/pull/33079#issuecomment-400140840):

[![DHH: Webpack’s support is awkward in my opinion and does not offer any benefits over Sprockets. Unlike in the realm of JavaScript compilation.](blog/webpack/dhh-awkward.png)](https://github.com/rails/rails/pull/33079#issuecomment-400140840)

> **@dwightwatson** Out of curiousity, what is the argument to continue using Sprockets for CSS/static assets when Webpacker supports them by default out of the box?

> **@dhh** Webpack’s support is awkward in my opinion and does not offer any benefits over Sprockets. Unlike in the realm of JavaScript compilation.

There's a lot to unpack there.

When it comes to asset bundling, the "Rails way" is webpack for JavaScript and Sprockets for everything else. The default setup in a fresh Rail 6 install, similar to what Basecamp uses, still compiles CSS, images, and fonts with Sprockets.

This means, if you're a member of the Basecamp camp, all your webpack JavaScript source files would live in `app/javascript` and all your Sprockets CSS and images would remain in `app/assets`. Running `rails assets:precompile` will first build all the Sprockets assets into the `public/assets` directory, then will build all the webpack assets into the `public/packs` directory.

To be very clear, this does not mean you need to run both Sprockets and Webpacker to serve assets for the browser. The two processes for bundling assets are completely separate and they do not share dependencies. Different helpers, different implementations, different directories, different, different, different. They are built in such a way that they can cohabitate a Rails application.

On the other hand, you could use _only_ Sprockets or _only_ Webpacker to bundle all your assets.

### Feeling, awkward?

DHH calls webpack's approach to handling non-JavaScript assets *awkward*. Now, I happen to like webpack a lot. But he's not wrong.

He says this because, to bundle CSS and images in webpack, you need to _import CSS and images from your JavaScript files_.

```javascript
import '../application.css'

import myImageUrl from '../images/my-image.jpg'
```

The reason for this is that webpack wants to treat **everything** as a JavaScript module. I mean _everything_.

All JavaScript imports are treated as JavaScript modules. To use CSS with webpack, you import it as you would a JavaScript module. To use an image with webpack, you import it as you would a JavaScript module. Depending on your perspective, this may be unusual—perhaps especially for Rails developers coming from Sprockets.

This isn't just a "Rails opinion". Consider this recent tweet from a prominent voice in the React community, [Ryan Florence](https://twitter.com/ryanflorence):

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">import url from &quot;./whatever.jpg&quot;<br>import html from &quot;./some.md&quot;<br>import str from &quot;raw!./some.js&quot;<br><br>So ... I gotta admit I love this stuff, but did we jump the shark here with JavaScript build tools? Should this stuff happen outside the JavaScript module bundler?</p>&mdash; Ryan Florence (@ryanflorence) <a href="https://twitter.com/ryanflorence/status/1258966331572928514?ref_src=twsrc%5Etfw">May 9, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Sounds a lot like discovering Sprockets in reverse? (I'm not surprised at that 50/50 split either).

While awkward to some, webpack's "Everything is a Module" mindset is also extremely powerful. There are some interesting possibilities when a tool goes **all in** with such a mental model. Think of what "Everything is an Object" has done for Ruby.

### Choosing Webpacker or Sprockets (or both)

The good news is there's no need to stress about it. Rails defaults mirror the preferred approach of the Basecamp team, but that doesn't mean you have to agree or that it's the right way to do things for your application. You can use both, as Basecamp does, or choose one over the other.

To help you decide, I adapted [this excellent guide from the react-rails project](https://github.com/reactjs/react-rails/wiki/Choosing-Sprockets-or-Webpacker):

#### Why Sprockets?

* My Rails app does not need much JavaScript
* I prefer global scripts and jQuery plugin enhancement, i.e. I don't need a proper JavaScript module system
* Upgrading my legacy Rails app to Webpacker would be too costly
* I don't need advanced tooling for local development
* It just works and I don't have time to ramp up on alternatives
* My Rails app relies on specific asset gems and I don't have NPM alternatives

#### Why not Sprockets?

* Sprockets is slowing down my local development experience
* I need more control over aspects of our asset compilation
* My app has a lot of JavaScript and needs code-splitting features to avoid massive payloads
* I'm concerned about long-term support

#### Why Webpacker?

* I want to use a proper JavaScript module system to manage dependencies, i.e., limit global scope pollution and have an explicit dependency graph with import/export and require
* I want to take advantage of the cutting edge features from ES6+, Babel, PostCSS
* I want intelligent code-splitting features such as dynamic imports and webpack's splitChunks optimization
* I want more flexibility with how my build system generates source maps
* I want advanced tooling for local development including hot module replacement
* I want to build Single Page Apps*

*You don't need to have a Single Page App to use webpack; it works quite well for "Multi Page Apps".

#### Why not Webpacker?

* My Rails app does not need much JavaScript
* I am a backend developer with limited knowledge of JavaScript ecosystem
* I am not ready to invest time to understand webpack and Webpacker
* It seems too complicated

#### Why use both?

* I prefer the "Rails way": Webpacker to compile JavaScript, Sprockets for CSS, images, and fonts
* I'm upgrading from Sprockets to Webpacker incrementally

### On a personal note

I want to leave Sprockets behind. Sprockets was a huge leap forward for asset management when it was first introduced but it hasn't taken advantage of newer possibilities. It languishes while webpack's key features, such as performance optimizations through code-splitting, are first class.

Webpack is more complex and does require some investment. For me, it's been worth it.

[I think webpack is a great choice for any application with a significant amount of JavaScript.](https://rossta.net/blog/reasons-to-switch-to-webpacker.html)

Which is right for you?
