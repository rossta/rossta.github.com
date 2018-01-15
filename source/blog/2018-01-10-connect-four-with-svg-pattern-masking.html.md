---
title: Connect Four with SVG pattern masking
author: Ross Kaffenberger
published: true
summary: Rendering transparent masks or making the impossible possible with SVG
description: An application of the technique of SVG pattern transparent to render a Connect Four board with transparent portholes.
pull_image: 'blog/connect-four-splash.png'
pull_image_caption: Background Photo by Matthew Kane on Unsplash
series: 'Connect Four'
category: Code
tags:
  - SVG
---

*This post is [part of a series on building Connect Four with Vue.js, SVG,
Elixir, and the Phoenix framework](/blog/series/connect-four.html).*

One of my recent side projects to learn new technologies
has been to build a browser-based rendition of [Connect
Four](https://en.wikipedia.org/wiki/Connect_Four).
The fully-functional version of the game will have both a backend and frontend
component with some good challenges including animating checkers
falling into place and connecting two players over the network.

In this post, we'll demonstrate rendering the static board with SVG, including
the use of pattern masking to emulate a game board wall with portholes through
which to view the checkers.

## Let's talk about SVG

SVG feels scary and confusing to the uninitiated, myself included. The good news
is that we can take a progressive approach to adopting SVG without understanding
everything there is to know about it at first.

Here are a few reasons why using SVG is a good fit to render the elements of a
Connect Four game board:

* SVG has shape elements like `<rect>` and `<circle>` that are better
  semantically than using divs to render columns and checkers using [the rounded
border trick](https://davidwalsh.name/css-circles)
* SVG provides simple, declarative rules for positioning visual elements; no
  need to mess with picture-perfect pixels, absolute positioning, and z-indexing
* SVG elements animate smoothly, which will allow us to render a dropped checker
  bouncing into place with a realistic touch and that it has a coordinate system
* SVG provides `<mask>` and `<pattern>` elements, so we can animate falling
  checkers behind "holes" in the game wall

## Pattern masking

A first pass at the game board might be to explicitly render circles for all 42
game cells (6 rows, 7 columns) and set their fill colors based on game state to
red, black, or as the background color to fake an empty cell. What if, instead,
we could render the game board with portholes punched into it? That way, the only
`<circle>` elements we need to render explicitly are the checkers themselves.

This is where SVG pattern masking comes in. A powerful feature of desktop visual
editing tools Adobe Photoshop/Illustrator is available on the web.
[Masking](https://www.w3.org/TR/SVG/masking.html) allows for a graphic (or set of
graphics) to act as a transparent overlay to reveal background elements. Applied
to our game, it provides a mechanism by which we can see checkers falling
through holes in the game board wall. To my knowledge, there's no (easy) way
with typical HTML/CSS to accomplish this other than, perhaps, creating a
transparent png, something we won't be able to manipulate easily
programmatically.

Let's start with a demonstration of pattern masking by rendering a single game
board cell and checker.

Within a containing `<svg>` element with a `viewBox` of 100x100 units, we'll
start by adding a `<circle>` to represent a checker positioned slightly
offscreen to mimic it falling into place.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="25" r="45" fill="#254689"></circle>
</svg>
```

The game wall is simply a `<rect>` positioned over the circle; once added, we
can't see the circle anymore.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="25" r="45" fill="#254689"></circle>
  <rect col="0" width="100" height="600" fill="cadetblue" mask="url(#cell-mask)"></rect>
</svg>
```

Now to create the hole with a pattern mask. To accomplish this, we use
(surprise) both a `<pattern>` and `<mask>` elements. These elements are not
graphical, meaning, they won't be directly rendered in the view box. Instead,
we'll later add the resulting mask as an attribute of our `<rect>` game wall—the
element we want to see through. The `<pattern>` and `<mask>` elements are nested
inside a `<defs>` element so they can be available for reuse.

```html
  <defs>
    <pattern id="cell-pattern" patternUnits="userSpaceOnUse" width="100" height="100">
      <circle cx="50" cy="50" r="45" fill="black"></circle>
    </pattern>
    <mask id="cell-mask">
      <rect width="100" height="100" fill="white"></rect>
      <rect width="100" height="100" fill="url(#cell-pattern)"></rect>
    </mask>
  </defs>
```
The `<pattern>` is simply matches the size of a cell, 100x100, and it contains a
`<circle>`, representing the hole, that matches the size of the checker. The
`<circle>` gets a fill color of "black"; when applied the to `<mask>`, this
this means the absence of space, or full transparency, as opposed to literal
black.

The `<mask>` is composed of two `<rect>` elements that match the game wall size;
the first gets a fill color of "white" (opposite of "black" in a mask) to
represent the part of the wall we want to be opaque. The second `<rect>` sits on
top of the first and has a `fill` of `url(#cell-pattern)` which refers to the
pattern we created above.

Now, we can set the `mask` attribute for our game wall `<rect>` by referencing
the `<mask>` element by id.

```
  <rect width="100" height="100" fill="cadetblue" mask="url(#cell-mask)"></rect>

```

This punches a hole through the wall to reveal the checker underneath.

Here's what we have so far on [CodePen](https://codepen.io/rossta/pen/NXMrLg):

<p data-height="265" data-theme-id="0" data-slug-hash="NXMrLg" data-default-tab="html,result" data-user="rossta" data-embed-version="2" data-pen-title="SVG mask demo" class="codepen">See the Pen <a href="https://codepen.io/rossta/pen/NXMrLg/">SVG mask demo</a> by Ross Kaffenberger (<a href="https://codepen.io/rossta">@rossta</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

<hr />

A nice feature of the `<pattern>` element is that it repeats itself based
on the height/width attributes we've provided. This means we can extend the dimensions of the view
box and our game wall `<rect>` to reveal the seven rows of a
single column—we don't have to add each circular hole to the DOM explicitly! To
build multiple columns, we'll simply, for each column, add a nested `<svg>`
element at the correct x position to wrap each masked `<rect>`. This allows us
to position each column relative to the container `<svg>` without needed to
specify x coordinates for each child `<rect>` and `<circle>`.

Here's the full demo of a static Connect Four SVG game board on
[CodePen](https://codepen.io/rossta/pen/eyrgJe):

<p data-height="370" data-theme-id="0" data-slug-hash="eyrgJe" data-default-tab="html,result" data-user="rossta" data-embed-version="2" data-pen-title="Connect Four board in SVG" class="codepen">See the Pen <a href="https://codepen.io/rossta/pen/eyrgJe/">Connect Four board in SVG</a> by Ross Kaffenberger (<a href="https://codepen.io/rossta">@rossta</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

<hr />

For more related info, check out the following resources:

* [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
* MDN docs for [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg), [`<pattern />`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern), [`<mask />`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask), and [`<defs />`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs)
* Pretty much anything [Sarah Drasner](https://twitter.com/sarah_edo) publishes, including [SVG Animations](http://shop.oreilly.com/product/0636920045335.do)

In [the next post](/blog/building-basic-connect-four-with-vuejs.html), we'll
take a look at using Vue.js to render the board dynamically and add checkers
based on user interaction.
