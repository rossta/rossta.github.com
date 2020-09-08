---
title: Definitive Guide to Page-Specific JavaScript with Webpacker
author: Ross Kaffenberger
published: false
summary: The RIGHT way to load only the code you need
description: Definitive Guide to Page-Specific JavaScript with Webpacker
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
pull_image_caption: Photo by Yoyo Ma on Unsplash
series:
category: Code
tags:
  - Rails
---

If you're using Webpacker and dividing your JavaScript into multiple packs without awareness of how webpack works, there's a good chance you're doing it wrong.

Prior experience with the Rails asset pipeline may lead developers to assume the mechanics of asset bundling works similarly with webpack when it most certainly does not.

These legacy assumptions are fraught with peril!

Using multiple packs, also known as "entry points", without proper configuration on a single page, modules may be duplicated. This poses a couple key problems for developers and their end users:

1. JavaScript payloads are larger—not smaller—causing increased download and parse times for the end user
1. Modules may assume "singleton" behavior or touch global concerns leading to confounding bugs when duplicated

> Having trouble understanding and optimizing webpack on Rails?
>
> [**Subscribe to my newsletter for occasional emails with new content.**](https://little-fog-6985.ck.page/9c5bc129d8).

Let's unravel this mystery.

First, we'll illustrate the problem in detail and demonstrate how developers can diagnose the problem in their own Rails applications.

Next, we'll develop an appropriate mental model for understanding how webpack bundles code. This will reveal why the problem arises when we apply an outdated mindset, one informed by the Rails asset pipeline, when integrating with Webpacker.

Finally, we'll come away with practical guidelines and tools and guidelines that will help us avoid the problem as we optimize webpack bundles the RIGHT WAY.

## Case study: Podia

Podia is a fantastic service that provides a platform for content creators to sell digital content including e-books, online courses, and webinars.

![Podia homepage](blog/draft-guide-to-page-specific-javascript/podia-homepage.png)

I call attention to Podia because

a. it's built with Rails
a. it uses webpack via Webpacker to bundle JavaScript
a. it's sending more JavaScript to your browser than it should

I'll aim to prove this last point and argue why I believe it's making a simple bundling mistake that you'll want to avoid if you're using Webpacker to bundle assets too.

When you sign up for an account on Podia as a content creator, you get a public-facing storefront and tools for administering your content, such as a dashboard for analytics and messaging and a storefront editor app.

Normal users may have access to at least three distinct areas of functionality:

1. The public-facing storefront
1. The dashboard
1. The storefront editor

I can tell Podia uses Webpacker to bundle assets from a few asset urls hosted by its site and CDN.

When I view source on such pages, I can find <script> tags for urls containing the default path to Webpacker assets, i.e., `/packs/js/...`. I can also navigate to the Webpacker manifest at `https://app.podia.com/packs/manifest.json`. This file is necessary for Rails to be able to locate Webpacker-bundled all the JavaScript, CSS, and images on disk or on CDN.

TODO: Excerpt

It a number of distinct entrypoints that map roughly to different sections of the site, like "cms/ui" and "storefront/index", or by feature, "comments" and "current_time_ago".

TODO: Excerpt:

In Webpacker, entrypoints are known as "packs."

A pack, or entrypoint, is intended to be the root of the webpack dependency graph of all the JavaScript modules to be included on a single page. Webpack typically recommends using _one entrypoint per page_ (TODO: link).

However, when I visit various pages, I find that sometimes multiple packs are loaded on the same page. Take, for example, the public-facing storefront. When I visit this page, my browser downloads the following "packs" from the Podia CDN:

```sh
/packs/js/storefront/index-1d9e9c36f5f9ab7056d1.js
/packs/js/storefront/current_time_ago-0c5c682d173647ef3199.js
/packs/js/storefront/messaging-60ddf6567eb7b74a1083.js
```

When I visit the Podia dashboard, I also see multiple packs are included on the page:

```sh
/packs/js/cms/ui-e5936b30e10be7bc4694.js
/packs/js/cms/messaging-15d4165b22948f023f63.js
```

The intent, I believe, is that Podia wants to deliver only required JavaScript to the client's browser. For example, there's no need to send JavaScript for the CMS UI to the public-facing storefront page.

This intent is good! Plenty of teams ignore this and are happy to deliver multi-megabyte JavaScript payloads on every page render.

## The problem

On closer look, though, something doesn't seem quite right. The payloads for these individual packs are rather large. Take the "storefront/current_time_ago.js" pack. It transfers as 73KB gzipped and 396KB parsed. I can't say for sure, but I imagine this pack's primary responsibility is to dynamically change database timestamps to human-friendly text like "2 hours ago" in the browser, much like the tiny jQuery plugin [timeago](https://timeago.org/) which claims a 2KB size.

Does Podia's "current_time_ago" functionality need to be nearly 400KB?

Fortunately, we can take a closer look to see what's going on.

Here's a graphical analysis of the packs for the storefront editor.

![Treemap image of webpack JavaScript bundles loaded on Podia's storefont editor](blog/draft-guide-to-page-specific-javascript/podia-source-map-explorer-bare.png)

That's a little hard to read on the web, so I've annotated the important bits:

**Podia storefront editor**

![Treemap image of duplicated JavaScript bundles loaded on Podia's storefront editor](blog/draft-guide-to-page-specific-javascript/podia-source-map-explorer-annotated.png)

This image displays a tree-map of each JavaScript bundle on the storefront editor. The image presents three bundles (purple, blue, orange) and their relatively-sized modules.

You can see bundled modules such as `actioncable`, `stimulus`, `moment.js`, `core-js`, and `cableready`.

Here's the problem: **some modules are bundled twice!**

All three of these bundles are included on the same page. Two of them include both moment.js and all the moment-locales. The browser has to download and parse moment.js (52KB) and moment-locales (326KB) twice!

Same for actioncable, cableready, stimulus, and core-js.

In an attempt to deliver less JavaScript to the browser with page-specific packs, they've ended up with even bigger payloads. Podia is ["overpacking!"](https://rossta.net/blog/overpacking-a-common-webpacker-mistake.html)

## More examples!

It's not just Podia here. It's happened at my company, Stitch Fix.

Here's source map analysis from the Dribbble profile page which loads two Webpacker packs with several duplicated modules including Vue, vuex, tippy, and axios.

**Funny or Die's home page**

You know what's not funny? Duplicate jQuery on the [Funny or Die](https://www.funnyordie.com) home page.

![Treemap image of duplicated JavaScript bundles loaded on Funny or Die's home page](blog/draft-guide-to-page-specific-javascript/funnyordie-source-map-explorer-annotated.png)

**Drizly product search page**

It's raining JavaScript at [Drizly](https://drizly.com/beer/c2)! The product search page renders three packs, each of which includes instances `material-ui`, `react`, and `lodash` among others. If Drizly were to introduce React hooks, [I am relatively certain multiple instances of React will cause issues if it hasn't already](https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react).

![Treemap image of duplicated JavaScript bundles loaded on Drizly's profile page](blog/draft-guide-to-page-specific-javascript/drizly-source-map-explorer-annotated.png)

**Teachable's course page**

The [course page on Teachable](https://www.jessicasprague.com/p/digibeginnerbundle) loves `jQuery` and `lodash` two times.

![Treemap image of duplicated JavaScript bundles loaded on Teachable's student course page](blog/draft-guide-to-page-specific-javascript/teachable-source-map-explorer-annotated.png)

**Strava's activity feed**

As an endurance athlete in my spare time, I use Strava almost daily. Each page load of the activity feed forces me to render `React` four times! [Invalid React hook warnings apply](https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react).

![Treemap image of duplicated JavaScript bundles loaded on Strava's activity feed](blog/draft-guide-to-page-specific-javascript/strava-source-map-explorer-annotated.png)

**Dribbble profile page**

I'm whistling the [Dribbble profile page](https://dribbble.com/_rossta) for multiple infractions, including `Vue` and `axios`.

![Treemap image of duplicated JavaScript bundles loaded on Dribbble's profile page](blog/draft-guide-to-page-specific-javascript/dribbble-source-map-explorer-annotated.png)

## Why the duplicate modules?

Let's be clear that the intent—to split code up into into smaller bundles—isn't wrong; it's just not happening the _webpack way_.

To optimize the Rails asset pipeline, we would divide up our bundles as needed and that's it. The story is not quite as straightforward with webpack.

If there's one thing you take away from this post, it's this:

> The Rails asset pipeline and webpack solve the same general problem, in _fundamentally different ways_:
>
> Webpack is a module bundler.
>
> The asset pipleine is a file concatenator.

The asset pipeline simply builds up list of what the developer explicitly requires and those files are pasted together, in order of inclusion, in the output.

Webpack will build up a dependency graph of all the imported module. Starting from the entry point, such as `app/javascript/packs/application.js`, webpack will parse the source file for and track each `import` and `require` statement. Webpack will then locate the source files for those imported modules and parse those files their imports, "walking the tree", so to speak. It's ok if a given module has been imported from multiple source files; webpack will make sure each module within the dependency graph is only imported once.

(TODO: image?)

_If that's true, why are there multiple instances of moment.js, @rails/stimulus, lodash, and so on, in Podias output?_

The answer: each pack is a separate dependency graph.

By default, webpack expects applications to render only one entry point per page. With that expectation in mind, if a developer imports lodash in pack one and pack two, webpack will bundle lodash in pack one and pack two.

What could be at play here is a broken mental model of how webpack bundles assets for the browser.

For Rails developers familiar with Sprockets, this is what the mental model could look like. Imagine requiring the "moment" library in one bundle and an imaginary moment plugin called "timeago" in another bundle.
(TODO: image?)
The resulting output mirrors the require statements in the source code. Since this is how things work in Sprockets, it might be reasonable to assume this is how things work in webpack.

However, the picture is much different. Consider that the "timeago" plugin provides its own import of "moment". Webpack recursively parses the import statements in all the dependencies within a single pack and will include those imports in the output.
(TODO: image?)
This means moment can end up in more than one bundle, even if you didn't explicitly import it; one of your dependencies did.

The legacy Rails asset pipeline mental model is holding us back.

In webpack/Webpacker, each pack is a separate dependency graph by default: all imported modules within a pack are included in the pack's output, regardless of whether that module is imported in another pack.

Keep in mind, webpack has no knowledge of Rails and, by default, no knowledge we might intend to render multiple packs on a single page. We can do this if we want, but we have to configure webpack to do so; that's not happening in the cases I've described in this post.

What we want is a way to split code up into smaller pieces without all the overhead and potential bugs. It turns out, webpack was originally created to address exactly this, the problem of code-splitting. It's just done in a fundamentally different way than what you might be used to.

## A note on performance

Let's acknowledge: _time is precious_.

When an end user visits a page on your site, time is needed to request data from your servers and more time is needed for the browser to process and render that data. Decreasing that time is good for you and good for your end users.

We all want faster websites. [Nate Berkopec has made a career of it](https://www.speedshop.co/).

[![Screenshot of Complete Guide to Rails Performance home page](blog/draft-guide-to-page-specific-javascript/complete-guide-to-rails-performance.png)](https://www.railsspeed.com/)

It goes without saying that the more JavaScript you bundle on a given page, more time will be needed for end users to download and parse that JavaScript. While this post isn't strictly a performance tutorial it will certainly help you avoid some common bottlenecks and helpful techniques related to minimizing asset bundle size.

## Measurement

Any discussion of performance optimization should include some data analysis. I'd recommend having a baseline of frontend user metrics, which you may be able to get with a monitoring tool like New Relic or even Google Analytics. There's also [Lighthouse](https://developers.google.com/web/tools/lighthouse) which can give you some solid recommendations and estimate user metric scores over an emulated throttled network connection.

_A word about DevTools profiling_

You'll want to be able to back your choices with data rather than blind guessing or copy & paste.

### Visualization

I would also (right away) install the [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer). I'd want to know what's going on in each of these packs you're using. As you saw in the other thread, you'd want to run this tool against your production build.

Pay close attention to what you see in the bundle analysis. When you start using multiple packs, you might be surprised what you see, namely, that you are bundling some of the same modules, like React in your case, _in every pack_. Why? Because you haven't instructed webpack to share modules across your bundles, i.e., webpack doesn't assume by default you have a multi-page application.

![Treemap diagram produced by webpack-bundle-analyzer with proper code-splitting](blog/draft-guide-to-page-specific-javascript/bundle-analysis-duplicate-modules.png)

Look closely at the example above, which was generated from a demo app with three separate packs that render React components, and you can see react-dom in all three bundles. This is, at best, a bad UX, since you're forcing the user to download the same module(s) on different pages in different bundles, and at worst, a source of confounding bugs, especially when using multiple packs on a single page.

## Assumptions

We're at a point where we our main "application.js" pack has grown to large. We've seen how manually splitting into multiple packs can lead to the duplicate module problem. If they way we've been doing is wrong, _what's the right way?_

Before we can answer that question, we need to establish a few assumptions I'll have to make without knowing your application.

I'll assume, from what you've described, that you are building a "multi-page application": server-side routing and a separate HTML views with some client-side rendering.

This is different from a single-page application in which all the routing and rendering is performed on the client side. The reason for the distinction is that bundling advice may differ depending on the context.

To start, what we need is one or very few entrypoint(s), i.e., packs. For smaller applications, just an "application.js" may be well worth the tradeoff of having an application that's easier to maintain over the added cost of learning how to best split up JS code with Webpack with little performance gain. For a larger application like Podia, I could envision a pack each for distinct sections of the site, like the public-facing storefront, the storefront editor, and the customer dashboard.

## Dynamic Imports: webpack's superpower

Once JavaScript has been consolidated into one or a few packs, we should use [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports) to lazy load page-specific code.

What is a dynamic import? It's a declarative way of importing a JavaScript module asynchrously. Let's say you have just one pack, "application.js"; you would still place all your JavaScript within the "application.js" dependency graph, but not all of this code would be loaded up-front.

**Before:**

```javascript
import '../src/pages/storefront'
```

**After:**

```javascript
import('../src/pages/storefront')
```

Webpack recognizes the dynamic `import()` function when it compiles your JS and will split the imported "chunk" into a separate file that can be loaded on-demand in the browser using a JS framework router or a simple trigger.

One way to conditionally load a dynamic import based on the controller action is to use [the gon gem](https://github.com/gazay/gon) bridge the Ruby-JavaScript divide:

```ruby
// storefront_controller.rb
before_action :initialize_gon_pages

def initialize_gon_pages
  gon.pages ||= []
  gon.pages << "storefront-editor"
end
```

```javascript
// app/javascript/src/initializers.js
const pages = gon.pages || []

pages.forEach((page) => {
  import(`../src/pages/${page}`)
})
```

Another approach is push the logic into JavaScript:

```javascript
// app/javascript/src/initializers.js

const path = window.location.pathname

if (path === '/storefront') {
  import('../pages/storefront')
} else if (path === '/dashboard' || path === '/messages') {
  import('../pages/cms')
} // ...
```

One thing to note is that dynamic imports are asynchronously loaded (by design). This means you may need to adjust logic if your application currently assumes JavaScript will already be downloaded and parsed at a certain point, say when the `'DOMContentLoaded'` event fires.

You could take advantage of the fact that dynamic imports return a Promise that resolves when the imported module had been loaded:

```javascript
const loaded = false

import('../pages/storefront').then(() => (loaded = true))
```

Dynamic imports can also be used for more general "initializers". The current_time_ago pack could just be a dynamic import to run on every page:

```javascript
// app/javascript/src/initializers.js

import('./current-time-ago')
```

or make it conditional with an event listener:

```javascript
// app/javascript/src/initializers.js

if (document.querySelector('.time-ago')) {
  import('./current-time-ago')
}
```

The promise resolves to imported module, which is useful for calling functions once loaded. Note also the use of the `webpackChunkName:` comment which is can be used to determine the name of the asynchronous JavaScript "chunk" that webpack will excise from the main bundle. See the [webpack docs for the full-list of magic comments to augment dynamic import behavior](https://webpack.js.org/api/module-methods/#magic-comments).

```javascript
function getDocument(src) {
  return import(
    /* webpackChunkName: 'pdfjs-dist' */
    'pdfjs-dist/webpack'
  ).then((pdfjs) => {
    return pdfjs.getDocument(src)
  })
}

getDocument('my-document.pdf').then(/*...*/)
```

### React 💜 dynamic imports

Many of the popular client-side frameworks offer support for dynamic imports.

For example, React recently introduced the `React.Lazy` API which allows

**Before:**

```javascript
import OtherComponent from './OtherComponent'
```

**After:**

```javascript
const OtherComponent = React.lazy(() => import('./OtherComponent'))
```

See also [this terrific guide on UI.dev](https://ui.dev/react-router-v4-code-splitting/) that demonstrates how to use dynamic imports with React.Lazy and React router to provide code-splitting across client-side route boundaries.

### Vue 💜 dynamic imports

You may know I'm a big fan of Vue, especially for frontends on Rails, and Vue has been dynamic-import friendly for what seems like ages.

**Before:**

```javascript
import OtherComponent from './OtherComponent'

export default {
  components: {
    OtherComponent,
  },
}
```

**After:**

```javascript
export default {
  components: {
    OtherComponent: () => import('./OtherComponent'),
  },
}
```

I love the elegance of the async component syntax there.

Dynamic imports are also nicely integrated into the Vue router:

**Before:**

```javascript
import Home from './Home'
const router = new VueRouter({
  routes: [{ path: '/home', component: Home }],
})
```

**After**

```javascript
const Home = () => import('./OtherComponent')

const router = new VueRouter({
  routes: [{ path: '/home', component: Home }],
})
```

The key point is this: dynamic imports will keep your dependencies in the same dependency graph but across multiple packaged files. Webpack provides the glue to load these files on-demand.

All the modules within to the original pack are shared across files regardless of whehter they were rendered as part of the initial page load or asynchronously through a dynamic import.

No more overpacking.

### Going further with splitChunks

The next step in the webpack optimization journey is to use [the splitChunks configuration API](https://help.github.com/en/github/managing-files-in-a-repository/getting-permanent-links-to-files) to split out bundles for vendor code that can be shared across packs. In other words, browsers wouldn't have to pay the cost of re-downloading bundles containing moment.js, lodash.js, etc., across multiple pages with a warm cache.

Let's assume you've got your head wrapped around the problem... how do you solve it? For a multi-page application, [webpack recommends](https://webpack.js.org/concepts/entry-points/#multi-page-application) the [splitChunks optimization](https://webpack.js.org/plugins/split-chunks-plugin/).

I won't go into too much detail about this API, which provides a number of options to play with, but it's easy enough to [enable it through the Webpacker config](https://github.com/rails/webpacker/blob/master/docs/webpack.md#add-splitchunks-webpack-v4):

```js
environment.splitChunks()
```

The result might looks something like this:
![Treemap diagram produced by webpack-bundle-analyzer with proper splitChunks code-splitting](blog/draft-guide-to-page-specific-javascript/bundle-analysis-split-chunks.png)

Notice it created _more bundles_ without the duplication. To correctly render a given page, there are some "vendor" packs and some shared bundles that webpack spits out to go with your explicit entry points. This is why the splitChunks optimization requires separate view helpers for rendering the javascript and stylesheet tags, e.g. https://github.com/rails/webpacker/blob/22ab02b7c84e917f985ecc76f5916d144f43bfbf/lib/webpacker/helper.rb#L102-L104

Webpack does the splitting in away so that the modules can be shared across bundles. Your application will now render _more_ bundles at a reduced cost across multiple pages (and even more so in a single page if your CDN provider has HTTP/2 enabled).

Beware though, this technique is a bit more advanced. It requires the use of separate Rails helpers, `javascript_packs_with_chunks_tag` and `stylesheet_packs_with_chunks_tag` which will output multiple bundles produced from a single pack and these helpers should only be used once during the page render. It may take some [reading up on the webpack docs](https://webpack.js.org/plugins/split-chunks-plugin/) and some experimentation with the chunking logic to achieve optimal results.

## Summing up

Webpack can be a bit confusing to understand at first and Webpacker goes a long way toward providing that "conceptual compression" to get developers up-and-running with webpack on Rails. Unfortunately, Webpacker doesn't yet provide the all the guard rails we need to avoid problems like overpacking.

Embracing new tools may mean a little more investment along with letting go of the way we used to do things. Applying the techniques described here can help ensure both a good experience for clients, who want faster web pages, and for developers, who want faster builds and fewer bugs.

Resources

[Where do you put your page specific javascript](https://stackoverflow.com/questions/59493803/using-rails-6-where-do-you-put-your-page-specific-javascript-code/59495659#59495659)

[Code Splitting with React Router](https://ui.dev/react-router-v4-code-splitting/)

[How we reduced our initial JS/CSS size by 67%](https://dev.to/goenning/how-we-reduced-our-initial-jscss-size-by-67-3ac0#code-splitting-on-route-level)

https://what-problem-does-it-solve.com/webpack/intro.html

Optimizing Podia's page

Github: example/podia-overpacking

Commit: 332b82a
Add Podia example with multiple packs, duplicate modules

![Bundle-analyzer treemap with duplicate modules](blog/draft-guide-to-page-specific-javascript/demo-podia/duplicate-modules-main.png)

Commit: b38b343
Refactoring to dynamic imports with pages and initializers

<%= Gon::Base.render_data %>

<script>
//<![CDATA[
window.gon={};gon.pages=["welcome"];
//]]>
</script>

![Bundle-analyzer treemap with dynamic imports](blog/draft-guide-to-page-specific-javascript/demo-podia/dynamic-imports-main.png)

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

![Bundle-analyzer treemap with moment locales ignored](blog/draft-guide-to-page-specific-javascript/demo-podia/ignore-moment-locales-main.png)

Commit: 91803a6
Adding splitChunks

```javascript
environment.splitChunks((config) => {
  return {
    ...config,
    ...{
      optimization: {
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          name: true,
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
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

![Bundle analyzer treemap with splitChunks optimization](blog/draft-guide-to-page-specific-javascript/demo-podia/split-chunks-main.png)

Commit: 86780fe
Multiple packs with split chunks

```ruby
class WebpackerHelper
  def javascript_packs
    @javascript_packs ||= %w[application]
  end

  def add_javascript_pack(pack_name)
    javascript_packs << pack_name
  end
end
```

```html
<%= add_javascript_pack 'welcome' %>
```

```html
<%= javascript_packs_with_chunks_tag *javascript_packs %>
<script src="/packs/js/runtime-e286e4ca3b88c69b473f.js"></script>
<script src="/packs/js/vendors~application~welcome-98f508416b8ba6b66d62.chunk.js"></script>
<script src="/packs/js/vendors~application-1c7a4ba8dc1716143987.chunk.js"></script>
<script src="/packs/js/application-8d58c7b893b6b1951a2e.chunk.js"></script>
<script src="/packs/js/welcome-fb37443e0ecdb8bb2456.chunk.js"></script>
```

---

### Rule 1: Use the webpack-bundle-analyzer

If there's one thing you should do right now, it's install the [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer).

With it, you'll be able to generate a

![Treemap diagram produced by webpack-bundle-analyzer with proper code-splitting](blog/draft-guide-to-page-specific-javascript/bundle-analysis-duplicate-modules.png)

No tool has helped me better understand what's happening when I bundle my source code with webpack.

If you must divide your code into multiple packs this tool is a _must-have_ to ensure you avoid duplicating modules on the same page.

### Rule 2: Render one pack per page to start

If you're just getting started with webpack through Webpacker, take baby steps towards optimization. As we've seen, rendering multiple packs on a single page.

If you're know what you're doing with webpack, you can absolutely use more than one pack on a single page. There are ways to configure webpack to share modules across entry points, which we'll get to later. Until you reach a certain comfort level, use one pack per page. That way, you'll ensure you won't duplicate modules on the same page.

## Rule 3: Code-split with dynamic imports, webpack's superpower

Ok, at this point, you might be wondering

Once JavaScript has been consolidated into one or a few packs, we should use [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports) to lazy load page-specific code.

What is a dynamic import? It's a declarative way of importing a JavaScript module asynchrously. Let's say you have just one pack, "application.js"; you would still place all your JavaScript within the "application.js" dependency graph, but not all of this code would be loaded up-front.

**Before:**

```javascript
import '../src/pages/storefront'
```

**After:**

```javascript
import('../src/pages/storefront')
```

Webpack recognizes the dynamic `import()` function when it compiles your JS and will split the imported "chunk" into a separate file that can be loaded on-demand in the browser using a JS framework router or a simple trigger. The dynamic import can be triggered conditionally like any other function, and unlike traditional imports.

The key point is this: dynamic imports will keep your dependencies in the same dependency graph but across multiple packaged files. Webpack provides the glue to load these files on-demand.

All the modules within to the original pack are shared across files regardless of whehter they were rendered as part of the initial page load or asynchronously through a dynamic import.

### Rule 4: Enable "splitChunks" if you must use multiple packs per page

The next step in the webpack optimization journey is to use [the splitChunks configuration API](https://help.github.com/en/github/managing-files-in-a-repository/getting-permanent-links-to-files) to split out bundles for vendor code that can be shared across packs. In other words, browsers wouldn't have to pay the cost of re-downloading bundles containing moment.js, lodash.js, etc., across multiple pages with a warm cache.

Let's assume you've got your head wrapped around the problem... how do you solve it? For a multi-page application, [webpack recommends](https://webpack.js.org/concepts/entry-points/#multi-page-application) the [splitChunks optimization](https://webpack.js.org/plugins/split-chunks-plugin/).

I won't go into too much detail about this API, which provides a number of options to play with, but it's easy enough to [enable it through the Webpacker config](https://github.com/rails/webpacker/blob/master/docs/webpack.md#add-splitchunks-webpack-v4):

```js
environment.splitChunks()
```

The result might looks something like this:
![Treemap diagram produced by webpack-bundle-analyzer with proper splitChunks code-splitting](blog/draft-guide-to-page-specific-javascript/bundle-analysis-split-chunks.png)

Notice it created _more bundles_ without the duplication. To correctly render a given page, there are some "vendor" packs and some shared bundles that webpack spits out to go with your explicit entry points. This is why the splitChunks optimization requires separate view helpers for rendering the javascript and stylesheet tags, e.g. https://github.com/rails/webpacker/blob/22ab02b7c84e917f985ecc76f5916d144f43bfbf/lib/webpacker/helper.rb#L102-L104

Webpack does the splitting in away so that the modules can be shared across bundles. Your application will now render _more_ bundles at a reduced cost across multiple pages (and even more so in a single page if your CDN provider has HTTP/2 enabled).

Beware though, this technique is a bit more advanced. It requires the use of separate Rails helpers, `javascript_packs_with_chunks_tag` and `stylesheet_packs_with_chunks_tag` which will output multiple bundles produced from a single pack and these helpers should only be used once during the page render. It may take some [reading up on the webpack docs](https://webpack.js.org/plugins/split-chunks-plugin/) and some experimentation with the chunking logic to achieve optimal results.

## Summing up

Webpack can be a bit confusing to understand at first and Webpacker goes a long way toward providing that "conceptual compression" to get developers up-and-running with webpack on Rails. Unfortunately, Webpacker doesn't yet provide the all the guard rails we need to avoid problems like overpacking.

Embracing new tools may mean a little more investment along with letting go of the way we used to do things. Applying the techniques described here can help ensure both a good experience for clients, who want faster web pages, and for developers, who want faster builds and fewer bugs.

Resources

[Where do you put your page specific javascript](https://stackoverflow.com/questions/59493803/using-rails-6-where-do-you-put-your-page-specific-javascript-code/59495659#59495659)

[Code Splitting with React Router](https://ui.dev/react-router-v4-code-splitting/)

[How we reduced our initial JS/CSS size by 67%](https://dev.to/goenning/how-we-reduced-our-initial-jscss-size-by-67-3ac0#code-splitting-on-route-level)

https://what-problem-does-it-solve.com/webpack/intro.html


----

## Guidelines for effective bundling

Now that we know what the problem is and how to diagnose it, what can we do about it?

In a future post, I'll go into detail about how to fix

Below, I summarize the steps I recommend taking to address code bloat in a Webpacker + Rails application. I have the webpack newbie in mind rather than folks more experienced with JavaScript module bundlers who may prioritize differently. The good news is, we can address these issues in stages and you may not need to work through all these concerns to reap benefits.

### Step 1: Start with one entry point per page

Webpack recommends one entry point per page. [From the webpack docs](https://webpack.js.org/concepts/entry-points):

> As a rule of thumb: Use exactly one entry point for each HTML document.

That's how webpack assumes your application will work out-of-the-box.

Practically speaking, that means there would be only one usage of `javascript_pack_tag` per page:

```html
<%= javascript_pack_tag "application" %>
```

Rendering multiple entry points on a single page requires additional configuration; and lead to the issues we've highlighted in this post. We'll get to that, but this is how what I recommend as you start out.

Does this mean you have to put everything in one pack? No, but...

### Step 2: Keep the number of packs small

Don't split your JavaScript into a ton of little packs/entry points unless you understand the tradeoffs and you're comfortable with webpack.

For smaller applications, just an "application.js" may be well worth the tradeoff of having an application that's easier to maintain over the added cost of learning how to best split up JS code with webpack with little performance gain.

For a larger application, I could envision a small number of packs to organize JavaScript for distinct sections of the application, like a public-facing storefront, a storefront editor, and a customer dashboard.

_Ok Ross, this sounds ridiculous. Render one pack per page, keep the number of packs small... these bundles could get huge!_

Ah, now we've come to webpack's sweet spot

### Step 3: Use dynamic imports

Webpack's original creator famously built it primarily to solve this problem of code-splitting. The result is [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports).

Dynamic imports allow you to define split points _in code_ rather than by configuration or through multiple entry points.

```javascript
// Contrived examples

// Import page-specific chunks
if (currentPage === 'storefront') {
  import('../src/pages/storefront')
}

// Import progressive enhancement chunks
if (document.querySelector('[data-timeago]').length) {
  import('../src/initializer/current_time_ago')
}

// Import bigger on-demand chunks following user interaction
document.addEventListener('[data-open-trix-editor]', 'click', () => {
  import('../src/components/trix_editor')
})
```

In the example above, the imported modules are not separate packs. They are simply additional modules that get included in the same dependency graph but are compiled as _separate files_ which webpack will load asynchronously at runtime.

This is the first step in achieving code-splitting with webpack/Webpacker while avoiding the duplicate module problem.

Does this mean import every little module in little dynamic chunks? Absolutely not. Measure, experiment. Consider the tradeoffs with handling asynchronous code loading. Time box your efforts

### Step 4: Go further with splitChunks... when you're ready

For a more powerful combination, use page-specific dynamic imports combined with [the splitChunks configuration API](https://help.github.com/en/github/managing-files-in-a-repository/getting-permanent-links-to-files) to split out bundles for vendor code that can be shared across packs. In other words, browsers wouldn't have to pay the cost of re-downloading bundles containing moment.js, lodash.js, etc., across multiple pages with a warm cache.

Beware though, this technique is a bit more advanced. It requires the use of separate Rails helpers, `javascript_packs_with_chunks_tag` and `stylesheet_packs_with_chunks_tag` which will output multiple bundles produced from a single pack and these helpers should only be used once during the page render. It may take some [reading up on the webpack docs](https://webpack.js.org/plugins/split-chunks-plugin/) and some experimentation with the chunking logic to achieve optimal results.

Check out the open-source [Forem](https://github.com/forem/forem) application (formerly dev.to) for a good example of how to do "splitChunks".
