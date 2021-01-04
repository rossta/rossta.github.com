---
title: These Rails apps are overpacking their JavaScript bundles
author: Ross Kaffenberger
published: true
summary: How to diagnose and prevent the "redundant module" problem with Webpacker
description: A case study of Rails applications making a common Webpacker mistake of rendering modules multiple times on a single page. We'll describe why the problem happens and present a Webpacker Packing Checklist for proper code-splitting.
pull_image: 'blog/stock/jorgen-haland-sheep-unsplash.jpg'
pull_image_caption: Photo by Jørgen Håland on Unsplash
pull_image_link: https://unsplash.com/@jhaland
series:
category: Code
tags:
  - Rails
  - Webpack
  - Feature
---

You might think dividing your JavaScript into multiple bundles will help improve page load performance. When done incorrectly with Webpacker, it's possible to make things worse.

This mistake appears relatively common. As I'll share in this post, I've discovered several of my favorite Rails applications are making browsers download and parse _more_ JavaScript than necessary even while attempting to send less.

I believe Rails developers may think the mechanics of packaging JavaScript for the browsers work similarly in Webpacker as it does with the Rails asset pipeline. This assumption is fraught with peril!

![Crash bang warehouse accident](blog/overpacking-case-studies/crash.gif)

As we'll see, Webpacker is a very different beast than the Rails asset pipeline. We need a different mental model to understand how it works. We should also follow a few basic guidelines to deliver JavaScript correctly and avoid falling victim to "bundle bloat."

First, let's take a little safari and see what we can do to help a few companies correct their Webpacker usage out in the wild.

> **Help me help them**: _If you know anyone who works at any of the following companies, please share this post or ask them to reach out to me at ross at rossta dot net._

## Case study: Podia

Podia is a fantastic service that provides content creators with a platform to sell digital content, including e-books, online courses, and webinars.

![Podia homepage](blog/overpacking-case-studies/podia-homepage.png)

We can tell Podia uses Webpacker to bundle assets because it renders a Webpacker manifest at `https://app.podia.com/packs/manifest.json`:

```json
{
  "admin/ui.css": "/packs/css/admin/ui-59291053.css",
  "admin/ui.js": "/packs/js/admin/ui-931ad01f76a9c8b4c1af.js",
  "admin/ui.js.map": "/packs/js/admin/ui-931ad01f76a9c8b4c1af.js.map",
  "application.js": "/packs/js/application-42b89cd8ec22763d95ae.js",
  "application.js.map": "/packs/js/application-42b89cd8ec22763d95ae.js.map",
//...
```

The manifest contains URLs to many Webpacker "packs," also described as [_entry points_ in the webpack docs](https://webpack.js.org/concepts/#entry).

When I visit the public-facing storefront, my browser downloads the following "packs" from the Podia CDN:

```sh
/packs/js/storefront/index-1d9e9c36f5f9ab7056d1.js
/packs/js/storefront/current_time_ago-0c5c682d173647ef3199.js
/packs/js/storefront/messaging-60ddf6567eb7b74a1083.js
```

By splitting JavaScript up across multiple files on this page, I believe Podia intends to deliver only required JavaScript to the client's browser. For example, there's no need to send JavaScript for the CMS UI to the public-facing storefront page.

As we said earlier, the intent here is good.

## The problem

On closer look, though, something doesn't seem quite right. The payloads for these individual packs are, in fact, rather large.

Take the "storefront/current_time_ago.js" bundle. It transfers as 73KB gzipped and comes out to 396KB of parsed JavaScript.

_Does Podia's "storefront/current_time_ago" functionality need to be nearly 400KB?_

If so, I'd be shocked. I imagine this pack's primary responsibility is similar to the tiny jQuery plugin [timeago](https://timeago.org/), which claims a 2KB size. As a comparison, a bundled version of `react-dom` module parses at around ~150KB.

Something's not right here.

### Exploring source maps

I don't work at Podia, so I can't use my favorite tool, [the webpack-bundle-analyzer](/blog/webpacker-output-analysis-with-webpack-bundle-analyzer.html), to peek inside the bundled JavaScript; this requires access to source code.

But, there's another trick we can use. We can find out what's happening inside these bundles from Podia's source maps.

_It's like magic._

![Corny magician gif](blog/overpacking-case-studies/magic.gif)

Source maps are included in production by default with Webpacker. You can find the URLs to source maps in the Webpacker manifest file, as shown above.

> If you're curious about why source maps in production are enabled by default in Webpacker, you may be interested in [this GitHub issue thread](https://github.com/rails/webpacker/issues/769).

Another place to find the URL to a source map is in the corresponding source file's last line:

```javascript
//# sourceMappingURL=application-42b89cd8ec22763d95ae.js.map
```

We can analyze Podia's publicly available source maps using [source-map-explorer](https://github.com/danvk/source-map-explorer). It can provide a visualization of all the modules bundled on this page. Here's an example:

![Treemap image example of webpack JavaScript bundles](blog/overpacking-case-studies/podia-source-map-explorer-bare.png)

**Podia storefront editor**

Here's a screenshot of the source-map-explorer treemap for the three Webpacker packs rendered on the storefront editor page, with my annotations for emphasis:

![Treemap image of duplicated JavaScript bundles loaded on Podia's storefront editor](blog/overpacking-case-studies/podia-source-map-explorer-annotated.png)

You can see the three JavaScript bundles in purple, blue, and orange, and with each, you can see included modules such as `actioncable`, `stimulus`, `moment.js`, `core-js`, and `cableready`.

Here's the problem: **some modules appear twice on the same page!**

![Mr. Bean is shocked](blog/overpacking-case-studies/mrbean.gif)

Two bundles include both moment.js and all the 100+ moment-locale modules. That means the browser has to download and parse moment.js (52KB) and moment-locales (326KB) twice on the same page!

Same for actioncable, cableready, stimulus, and core-js.

In an attempt to deliver less JavaScript to the browser with page-specific bundles, they've ended up with even bigger payloads. Podia is ["overpacking"](/blog/overpacking-a-common-webpacker-mistake.html), and it's resulting in the **redundant module problem**.

## More case studies

It's not just Podia. I've recently discovered several other Rails applications with the same problem.

**Funny or Die**
![Funny or Die home page](blog/overpacking-case-studies/page-funnyordie.png)

I'm always up for a laugh, but you know what's _not_ funny? Duplicate `jquery` on the [Funny or Die](https://www.funnyordie.com) home page.

That's an extra 80KB and, I would presume, a potential source of bugs for jquery plugins that assume only one instance of `$` in the page scope.

![Treemap image of duplicated JavaScript bundles loaded on Funny or Die's home page](blog/overpacking-case-studies/funnyordie-source-map-explorer-annotated.png)

**Dribbble**
![Dribbble profile page](blog/overpacking-case-studies/page-dribbble.png)

I'm whistling the [Dribbble profile page](https://dribbble.com/dribbble) for multiple infractions, including duplicate instances of `vue` and `axios`. They could reduce their total payload size by up to 150KB.

![Treemap image of duplicated JavaScript bundles loaded on Dribbble's profile page](blog/overpacking-case-studies/dribbble-source-map-explorer-annotated.png)

**Teachable**
![Teachable course page](blog/overpacking-case-studies/page-teachable.png)

The [course page on Teachable](https://www.jessicasprague.com/p/digibeginnerbundle) must love `jquery` and `lodash`. They're both bundled twice across the three Webpacker packs rendered on this page.

![Treemap image of duplicated JavaScript bundles loaded on Teachable's student course page](blog/overpacking-case-studies/teachable-source-map-explorer-annotated.png)

**Drizly**
![Drizly search page](blog/overpacking-case-studies/page-drizly.png)

It's raining JavaScript at [Drizly](https://drizly.com/beer/c2)! The product search page renders three packs, each of which includes instances `material-ui`, `react`, and `lodash`, among others. If Drizly were to introduce React hooks, I am relatively sure [multiple instances of React will cause issues](https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react) if they haven't already.

![Treemap image of duplicated JavaScript bundles loaded on Drizly's profile page](blog/overpacking-case-studies/drizly-source-map-explorer-annotated.png)

**Strava's activity feed**
![Strava activity feed](blog/overpacking-case-studies/page-strava.png)

As an endurance athlete in my spare time, I use Strava almost daily, where the activity feed forces me to render four instances of `react`! Strava could reduce their activity feed payloads by a whopping 500KB by getting rid of their duplicated modules.

![Treemap image of duplicated JavaScript bundles loaded on Strava's activity feed](blog/overpacking-case-studies/strava-source-map-explorer-annotated.png)

### Analyzing JavaScript usage

Another tool I recommend is [bundle-wizard](https://github.com/aholachek/bundle-wizard), which can be used to find unused JavaScript modules on page load.

```sh
$ npx -p puppeteer -p bundle-wizard bundle-wizard --interact
```

This tool turns the source-map-explorer into a heatmap representing code coverage across the bundled modules from high (green) to low (red).

Here are the source maps from the Strava activity feed visualized again with bundle-wizard coverage heatmap:
![Bundle wizard treemap with heatmap overlay](blog/overpacking-case-studies/bundle-wizard-strava-optimized.png)

See all that red? Those extra React modules are unused on page load.

### Measuring end user performance

We can also see whether Google's [Lighthouse](https://developers.google.com/web/tools/lighthouse) performance auditing tool would back these findings.

> Lighthouse is an open-source, automated tool that can perform web page audits for performance, accessibility, among other quality indicators. [You can generate a Lighthouse report for almost any page you can access on the web through Chrome DevTools or a Firefox extension](https://developers.google.com/web/tools/lighthouse).

I generated [this Lighthouse report for my Strava dashboard](https://googlechrome.github.io/lighthouse/viewer/?gist=2a3785da1cfa4922190f3924d02edf39):

[![Lighthouse report screenshot for strava.com/dashboard](blog/overpacking-case-studies/lighthouse-strava-optimized.png)](https://googlechrome.github.io/lighthouse/viewer/?gist=2a3785da1cfa4922190f3924d02edf39)

The page scores 23/100 based on [Lighthouse's performance metric scoring rubric](https://web.dev/performance-scoring/), and, by far, the _biggest opportunity_ for improving page load performance is to remove unused JavaScript.

This much is clear: JavaScript bloat is hampering the performance of these Rails apps.

## Why the redundant modules?

It should be clear by now some Rails apps using Webpacker are bundling some modules unnecessarily across multiple bundles on a single page. As a result:

1. JavaScript payloads are larger—not smaller—causing increased download and parse times for the end user
1. Logic may assume "singleton" behavior or touch global concerns leading to confounding bugs

So why is this happening?

These Rails applications aren't intentionally bundling all this extra JavaScript. The fact that they are splitting up their bundles indicates they are attempting to be selective about what JavaScript is delivered on a given page.

_Wait, so we can't split code into multiple bundles without duplicating modules in Webpacker?_

Let's be clear that the practice of code-splitting isn't wrong; [it's a recommended best practice](https://web.dev/reduce-javascript-payloads-with-code-splitting/) for improving page load performance.

The problem with these examples is in the execution; it's not happening _the way webpack expects_.

Consider [Cookpad.com](https://cookpad.com). It's a Rails app that renders numerous Webpacker bundles on its home page, yet no modules are duplicated:

![Treemap of Cookpad source mapsl](blog/overpacking-case-studies/cookpad-source-map-explorer-annotated-optimized.png)

When it comes to Webpacker, the Cookpad recipe is top-notch.

## A new mental model

The redundant module problem highlights that although the Rails asset pipeline and webpack solve the same general problem, they do so in _fundamentally different ways_.

> Webpack is a module bundler.
>
> The asset pipeline is a file concatenator.

The asset pipeline builds a list of what the developer explicitly requires. Think of it as a stack. "What you see is what you get."

![St."ck](blog/overpacking-case-studies/analog-sprockets-stack.png)

Webpack, on the other hand, recursively parses the import statements in all the dependencies within a single pack, such as `app/javascript/packs/application.js`, like a directed graph.

![Directed graph](blog/overpacking-case-studies/analog-webpack-graph.png)

Webpack will include all imported modules in the output, ensuring that no import is included in the same bundle twice.

_If that's true, why are there multiple instances modules in Podia's output, for example?_

The reason: **each pack is a separate dependency graph.**

Consider this illustration of an imaginary project with multiple packs. One pack imports `moment` explicitly, and the other pack imports a made-up `timeago` plugin that depends on `moment`.

![Image of Webpacker bundling assets with multiple packs](blog/overpacking-case-studies/imports-webpacker.png)

See that the `moment` package is imported in both packs. There is an explicit import in the first pack, and an implicit import via `timeago` in the other.

So splitting your code into multiple packs can lead to this problem _if_ you don't configure webpack properly.

What we want is a way to split code up into smaller pieces without all the overhead and potential bugs. It turns out, webpack was initially created to address precisely this: code-splitting.

It's just done differently than you expect.

## The Webpacker Packing Checklist

Now that we know what the problem is and how to diagnose it, what can we do about it?

The key to addressing this kind of Webpacker code bloat is to keep _all dependencies in the same dependency graph_.

Below, I summarize the steps I would take to help these companies, which you can apply in your applications. These steps are iterative; you need not complete all these actions to begin seeing benefits.

### Step 1: Start with one entry point per page

Webpack recommends one entry point per page. [From the webpack docs](https://webpack.js.org/concepts/entry-points):

> As a rule of thumb: Use precisely one entry point for each HTML document.

That's how webpack assumes your application will work out-of-the-box. Practically speaking, that means there would be only one usage of `javascript_pack_tag` per page:

```html
<%= javascript_pack_tag "application" %>
```

For the companies described in this post, that would mean consolidating those separate packs into one on a page. Rendering multiple entry points on a single page _correctly_ requires additional configuration. We'll get to that, but "one pack per page" is how I recommend starting.

Does this mean you have to put **all** your JavaScript in one pack? No, but:

### Step 2: Keep the number of packs small

Don't split your JavaScript into a ton of little packs/entry points unless you understand the tradeoffs, and you're comfortable with webpack.

For smaller applications, just an "application.js" may be well worth the tradeoff of having an application that's easier to maintain over the added cost of learning how to best split up JS code with webpack with little performance gain.

Think of packs as the entry points to _distinct_ experiences rather than page-specific bundles.

For Podia, this could be one pack for the public-facing storefront, one for the storefront editor, one for the customer dashboard. Maybe an employee admin area pack. That's it.

_Render one pack per page?... Keep the number of packs small? ... these bundles could get huge!_

Ok, now we've come to webpack's sweet spot:

### Step 3: Use dynamic imports

Webpack has several automated features for code-splitting that will never be supported in the Rails asset pipeline. The primary example of this is [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports).

Dynamic imports allow you to define split points _in code_ rather than by configuration or multiple entry points. Note the `import()` function syntax:

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

In the example above, the imported modules are not separate packs. They are modules included in the same dependency graph but compiled as _separate files_. Webpack will load dynamic imports asynchronously at runtime.

_Dynamic imports allow you to divide your "packs" into smaller pieces while avoiding the redundant module problem._

Does this mean import every little module in little dynamic chunks? No. Measure, experiment. Consider the tradeoffs with handling asynchronous code loading. Timebox your efforts

### Step 4: Go further with splitChunks, but only when you're ready

For a more powerful combination, use page-specific dynamic imports combined with [the splitChunks configuration API](https://help.github.com/en/github/managing-files-in-a-repository/getting-permanent-links-to-files) to split out bundles for vendor code that can be shared across packs. In other words, browsers wouldn't have to pay the cost of re-downloading bundles containing moment.js, lodash.js, etc., across multiple pages with a warm cache.

Beware, though; this technique is a bit more advanced. It requires the use of separate Rails helpers, `javascript_packs_with_chunks_tag` and `stylesheet_packs_with_chunks_tag`, which will output multiple bundles produced from a single pack and these helpers should only be used once during the page render. It may take some [reading up on the webpack docs](https://webpack.js.org/plugins/split-chunks-plugin/) and some experimentation with the chunking logic to achieve optimal results.

Check out the open-source [Forem](https://github.com/forem/forem) application (formerly dev.to) for an excellent example of how to do "splitChunks."

## Summing up

Webpack can be a bit confusing to understand at first. Webpacker goes a long way toward providing that "conceptual compression" to get developers up-and-running on Rails. Unfortunately, Webpacker doesn't yet offer _all_ the guard rails required to avoid problems like overpacking. As we've seen, some Rails apps are using Webpacker with an asset-pipeline mindset.

Embracing new tools may mean a little more investment, along with letting go of the way we used to do things.

Apply the Webpacker Packing Checklist to ensure a good experience for clients who desire faster webpages and developers who want fewer bugs.
