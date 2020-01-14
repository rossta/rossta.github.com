---
title: 3 ways Webpack surprises web developers
author: Ross Kaffenberger
published: true
summary: What I learned answering Webpack questions on StackOverflow for a month
description: When I first started working with Webpack, I was in for a few surprises. I assumed how things should behave, based on my previous experience with the Rails asset pipeline, only to learn through experience how I was wrong.
pull_image: 'blog/stock/aaron-burden-balloons-unsplash.jpg'
pull_image_caption: Photo by Aaron Burden on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
---

Following this recent announcement from [@dhh](https://twitter.com/dhh) and the release of Rails 6 last year, more and more Rails developers will be looking to adopt Webpack in their applications:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Webpack is now the default JavaScript compiler for the upcoming Rails 6 🎉 <a href="https://t.co/LJzCSoPfCV">https://t.co/LJzCSoPfCV</a></p>&mdash; DHH (@dhh) <a href="https://twitter.com/dhh/status/1046634277985611776?ref_src=twsrc%5Etfw">October 1, 2018</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

When I first started working with Webpack, I didn't realize how under-prepared I was. I was tasked with [integrating Webpack into a large Rails app](/blog/from-sprockets-to-webpack.html) and I made a lot of mistakes along the way. I assumed how things should behave based on my previous experience with the Rails asset pipeline. Many of these assumptions turned out to be wrong. This was frustrating and humbling.

And after spending the last month answering Webpack questions on StackOverflow, I've found I'm not alone.

The intended audience for this post has a general notion of "why use Webpack" or "why use an asset bundler", but for more on that, I recommend [The Many Jobs of JS Build Tools](https://www.swyx.io/writing/jobs-of-js-build-tools/) and [Webpack from Nothing: What problem are we solving?](https://what-problem-does-it-solve.com/webpack/index.html). For a rigorous technical overview of the project, I suggest [the Webpack docs](https://webpack.js.org/); they have gotten quite good.

For this post, we're going to look at three common surprises web developers face when learning Webpack: why using global variables doesn't behave the way you might think, how Webpack treats everything as a JavaScript module, and the big learning curve for configuring Webpack effectively.

### 1. Global variables are not your friend

I learned to program using script tags and html files loaded directly in the browser. I tied everything together with global variables. It was great.

And for better or worse, every Rails I've worked on, and it's been dozens over the years, has relied on global variables and script tag snippets to make things work. Here is a basic example:

```erb
<!-- app/view/posts/index.html.erb -->
<%= @posts.each do |post| %>
  <!-- ... -->
<% end %>
<a href="#" class="button--show-more">Show more</a>

<script>
  $('.button--show-more').click(function() {
    MyApp.fetchPosts() // etc...
  })

  // MyApp and $ are global variables
</script>
```

This approach is typical with old-school bundlers like the Rails asset pipeline because they concatenate JavaScript dependencies in the global scope. This, despite the general notion that [global variables are bad](https://stackoverflow.com/questions/2613310/ive-heard-global-variables-are-bad-what-alternative-solution-should-i-use). Notably, the Rails asset pipeline came into existence before the rise of Node.js and, subsequently, formal JavaScript modules, and it never adapted. Many prefer this way of doing things. I still lean on global variables now and then.

Things work differently in Webpack. It does not expose its bundled modules to the global scope by default. To reference code in another module, it expects explicit imports that reference that module's explicit exports. The scope in which modules are evaluated is local, not global, i.e., the contents of each file are wrapped in a function.

Things are trickier if we expect to access bundled JavaScript from HTML, like `MyApp.fetchPosts()` above. Options include manually attaching variables to the global scope, e.g. `window.$ = require('jquery')` or modify the Webpack configuration to "expose" variables globally, as is demonstrated in this [StackOverflow post](https://stackoverflow.com/questions/58580996/unable-to-access-jquery-from-my-views-on-ror/58751163#58751163) (and many others).

This serves as an illustration of how a legacy practice would be swimming upstream in a Webpacker-enabled app: it takes effort.

> But why?

#### Webpack is a module bundler

Webpack describes itself as ["a static module bundler for modern JavaScript applications"](https://webpack.js.org/conceptsl). For developers used to unfettered access to JavaScript global scope, the switch to working in a modular system comes as a surprise. I argue that adopting Webpack effectively means understanding JavaScript modules.

> So what then is a JavaScript module?

For a fantastic introduction to JavaScript modules, I suggest Preethi Kasireddy's [Javascript Modules: A Beginner's Guide](https://www.freecodecamp.org/news/javascript-modules-a-beginner-s-guide-783f7d7a5fcc/) on freeCodeCamp. I'll attempt to summarize.

Generally speaking, a JavaScript module is a self-contained, reusable piece of code. This definition though is inadequate to capture the behavior of various flavors of JavaScript modules, ranging from simple patterns to formal systems supported by common JavaScript runtimes.

In recent years, several popular JavaScript module definitions have become widely adopted, each with their own characteristics, including [CommonJS](https://requirejs.org/docs/commonjs.html), [Asynchronous Module Definition](https://requirejs.org/docs/whyamd.html#amd) (AMD), and [EcmaScript (ES) Modules](https://exploringjs.com/es6/ch_modules.html) to name a few.

![How did the big bang happen? require('everything')](blog/require-everything.png)

Webpack can be configured to recognize any of these module formats.

Webpack transpiles your application's source files into JavaScript modules the browser can understand. It adds code to your bundle to tie these modules together. This has implications for how developers write code which means the old-school patterns that worked with the Rails asset pipeline may not work in the Webpack context.

#### Avoid legacy code if you can

[Some](https://stackoverflow.com/questions/28969861/managing-jquery-plugin-dependency-in-webpack) [of the](https://stackoverflow.com/questions/59042437/gmaps-with-rails-6-webpack) [most](https://stackoverflow.com/questions/59670743/leaflet-with-webpack-in-rails-6-l-timeline-is-not-a-function) [frequent](https://stackoverflow.com/questions/40575637/how-to-use-webpack-with-google-maps-api) Webpack issues that pop up on StackOverflow highlight this disparity between the context in which Webpack works best and the context for which legacy code was written.

Consider any jQuery plugin in your app that's more than a few years old; any one of them may not play nice with Webpack. The plugin system in a way is a relic of the pre-module era; attaching to a global variable was the easy way to reuse and reference functionality across the app.

Many jQuery plugins (or many legacy plugins in general) have been written without awareness of JavaScript modules and assume execution within the global scope. Be ready to weigh the tradeoff of learning how to configure Webpack to play nicely with legacy code or replace it with something else altogether.

In Webpack, global variables are not your friend, my friend.

### 2. Webpack treats everything as a JavaScript module

Webpack is so committed to its "module bundler" role it treats other static assets, including CSS, images, fonts, etc., as JavaScript modules too.

> Say what?

When I first learned this about Webpack, I was totally confused: How does Webpack produce stylesheets out of JS? How would I reference the an image tag's `src` for bundled images? What does it mean to import an _image module_ in JavaScript?

It helps to understand that Webpack must be configured, typically with [loaders](https://webpack.js.org/loaders/) or [plugins](https://webpack.js.org/plugins/), to handle different various files types as modules. How Webpack processes various file types as output depends which loaders are used.

Many projects integrate with Babel to process JavaScript files written with ES2015+ syntax. CSS files might be bundled as JavaScript Blob objects that are dynamically inserted in the DOM; otherwise it can be extracted into a CSS stylesheet a side-effect of module compilation.

Webpack only needs one JavaScript file in your source code as an entry point to produce a dependency graph of all the JavaScript, CSS, images, fonts, svg, etc. that you intend to bundle as static assets for the browser.

An interesting consequence of Webpack putting JavaScript first is there only needs to be one entry point to produce both a JavaScript and a CSS bundle. In the Rails asset pipeline, the JavaScript and CSS source code is kept completely separate:

```
app/assets
├── javascripts
│   └── application.js   # produces js bundle
└── stylesheets
    └── application.css  # produces css bundle
```

In Webpack everything hangs off the javascript entry point, or "packs". So assuming you have statements like `import 'styles.css'` somewhere in your JavaScript dependency graph, both `application.js` and `application.css` bundles will be produced.

```
app/javascript
└── packs
    └── application.js   # produces both js and css bundles
```

The mixing of CSS bundled in JavaScript and treated as JavaScript modules has isn't strictly necessary, but it most certainly a mental leap for the uninitiated.

### 3. Webpack configuration is extreme pluggable

There's a reason Webpack configuration has such a high barrier to entry: Webpack is the ultimate delegator.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I continue to be amazed at how many learners seem to almost deliberately avoid reading the actual official docs for the tools they&#39;re trying to use. I keep seeing folks asking for Udemy courses and &quot;best tutorials&quot; and stuff.<br><br>Why do people avoid reading actual docs?</p>&mdash; Mark Erikson (@acemarke) <a href="https://twitter.com/acemarke/status/1213898963679633411?ref_src=twsrc%5Etfw">January 5, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Coming from Rails, which famously values "convention over configuration", the ergonomics of setting up a Webpack configuration cause discomfort. It aims to be extremely flexible and extensible; to that end, it succeeds superbly. To serve this goal, Webpack provides a large array of [configuration options](https://webpack.js.org/configuration/). On top of that, most Webpack configurations bring in a number of loader and plugins, each of which have their own configuration requirements.

Faced having to learn Webpack, Babel, PostCSS, not to mention, Webpacker's abstractions around Webpack, it's no wonder we're intimidated. That's a lot to wrap your head around.

One of Webpacker's goals, in a similar fashion to [create-react-app](https://github.com/facebook/create-react-app) and the [vue-cli](https://cli.vuejs.org/), is to provide a Webpack config with sane defaults, i.e. the "convention". Depending on your project's needs, these "out-of-the-box" setups may get you quite far. Unfortunately, for any non-trivial modification, like getting a large legacy library to work with global variables or optimizing your build time by splitting out vendor dependencies, developers must be prepared to dive into the documentation and search for answers far and wide on StackOverflow and Medium.

![I'm not sure if I'm a good developer or good at googling](blog/good-developer-or-good-at-googling.png)

### 4. Bonus: Webpack is a powerful tool

I've grown to love Webpack and, I admit, this appreciation was hard-earned. As I've gotten over the initial hurdles of making my Webpack config work for my projects, I've come to value a number of Webpack's benefits, including optimizing bundle size through [tree-shaking](https://webpack.js.org/guides/tree-shaking/), code splitting via [asynchronous dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports) and the [split chunks plugin](https://webpack.js.org/plugins/split-chunks-plugin/) and support for [preloading and prefetching](https://webpack.js.org/guides/code-splitting/#prefetchingpreloading-modules). All of these features are virtually non-existent in the Rails asset pipeline.

These major strengths of Webpack all boil down to improving user experience: using it effectively can help improve metrics like [Time-to-Interactive](https://calendar.perfplanet.com/2017/time-to-interactive-measuring-more-of-the-user-experience/) and [First Contentful Paint](https://developers.google.com/web/fundamentals/performance/user-centric-performance-metrics#first_paint_and_first_contentful_paint). These things matter and are ever more crucial as we lean more heavily on client-side code build rich interfaces delivered across a widening array of devices and networks.

Webpack receives a fair number of criticisms regarding its complexity and some of its surprising traits, like the ones I highlighted here. To be fair, Webpack aims to solve a complex problem and solves it quite well. Other asset bundlers are worth your consideration, but, arguably, no other bundler has been as successful.
