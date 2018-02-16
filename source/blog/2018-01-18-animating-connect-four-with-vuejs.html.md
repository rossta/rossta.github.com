---
title: Animating Connect Four with Vue.js
author: Ross Kaffenberger
published: true
summary: How the Vue transition component "drops" things into place
description: Continuing our series on building Connect Four in Vue and Phoenix, we'll use Vue transitions and a third party library to animate the SVG checkers falling and bouncing into place when added to the game board.
pull_image: 'blog/connect-four-nightsky.png'
pull_image_caption: Background Photo by Andrew Preble on Unsplash
series: 'Connect Four'
category: Code
tags:
  - SVG
  - Vue
---

When we left off our [Connect Four game last](/blog/basic-connect-four-with-vuejs.html), we used Vue.js components to convert a static HTML view of the Connect Four board into a playable
interface. In this post, we'll animate the checkers falling and bouncing into
place when added to the game board.

Here's how the game behaved at the end of [the previous post](/blog/basic-connect-four-with-vuejs.html):

<p data-height="485" data-theme-id="light" data-slug-hash="eyrMBy" data-default-tab="js,result" data-user="rossta" data-embed-version="2" data-pen-title="Connect Four Vue.js, SVG: first pass" class="codepen">See the Pen <a href="https://codepen.io/rossta/pen/eyrMBy/">Connect Four Vue.js, SVG: first pass</a> by Ross Kaffenberger (<a href="https://codepen.io/rossta">@rossta</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

<hr />

Clicking columns simply adds new checkers to the board in the first available
slots. Though it works, it doesn't quite *feel* like Connect Four; we want
checkers falling to the bottom of each column.

## Vue transitions

Vue.js can help us here. It provides a number of features to support
*transitions*, such as adding/removing single elements, adding/removing items in
a list, and even between values in data itself. Vue provides a [`<transition>`
component, which can be leveraged to animate elements as they enter and leave the DOM](https://vuejs.org/v2/guide/transitions.html#Transitioning-Single-Elements-Components). This is what we'll use to animate checkers when they are added to the board.

```
<transition>
  <!-- magic -->
</transition>
```

The Vue `<transition>` element has mechanisms for either CSS or JavaScript
animation. Since we'll have exact coordinates as component properties
representing the start and end points of the checker's fall, we'll want to reach
for the component's [JavaScript
hooks](https://vuejs.org/v2/guide/transitions.html#JavaScript-Hooks), which
include `before-enter`, `enter`, `after-enter`, `before-leave`, `leave`, etc. To
keep things short and sweet, we'll simply animate checkers as they are added to
the board—we may come back to animating of release of checkers from the
board in a later post.

## Adding a checker transition

The template for our checker is simply a SVG `<circle>` element with `cx` and
`cy` properties to indicate its resting position in the column.

```
<!-- board-checker-template -->
<circle :cx="centerX" :cy="centerY" ... />
```
Each of these HTML properties is bound to component properties in the `BoardChecker`.

```
const BoardChecker = Vue.component('board-checker', {
  computed: {
    centerX() {
      return (this.cellSize / 2);
    },

    centerY() {
      return (this.cellSize / 2) + (this.cellSize * (this.rowCount - 1 - this.row));
    },

    // ...
  },
});
```

To animate the arrival of this checker to the board, we need to wrap the
`<circle>` in a `<transition>` element.

```
<transition
  @enter="enter"
  :css="false"
  >
  <circle ... />
</transition>
```

As we'll only JavaScript animation for the transition, Vue recommends setting
the `:css` property to `false` as an optimization. We also bind a callback named
"enter" to the `@enter` listener on the `<transition>` component. The definition
of that callback will be a method on the `BoardChecker` component:

```
const BoardChecker = Vue.component('board-checker', {
  method: {
    enter(element, done) {
      // animate!

      done();
    },

    // ...
  },
});
```

Vue expects that the `enter` callback may be asynchronous, so the framework
provides a `done` parameter which is a function that must be called to indicate that the
transition has completed.

## Animating the transition

So how to animate? We can lean on a third-party library to do the heavy-lifting;
we just need to wire it up correctly to get the desired effect. I chose the
`GSAP` library from [Greensock](https://greensock.com/) which is well-suited for
SVG animation, though just about any popular animation library could work in its
place. But don't take it from me—here's what expert, Sarah Drasner, has to say
in her book [SVG Animations](http://shop.oreilly.com/product/0636920045335.do):

> Due to the fact that GreenSock corrects some of SVG’s cross-browser quirks,
> and has thought of every different use case for animation, GreenSock is going
> to be the animation technology I recommend for production sites most
> frequently.

The GSAP ships with a number of utilities to support complex animation and
synchronization. We're going to use the
[`TweenMax.fromTo`](https://greensock.com/docs/TweenMax/static.fromTo) function
with an easing parameter to bounce the checker in to place. It needs a target
element, a duration, "from params", and "to params", which describe the
animation at the start and end—hence, `fromTo`:

```javascript
TweenMax.fromTo(element, duration, { y: startPosition }, { y: endPosition });
```

Since the checker's path of motion will have only vertical motion, we will
animate the `y` position. The key insight is to understand that the `TweenMax`
start and end `y` positions are relative to element's static position; in this
case, that is the `cy` property of our `<circle>` element. The start position
for the animiation must be above the checker's finish position, it's given `cy`
coordinate; because the origin of the SVG view box is in the top left, the
vertical start position must be a *negative* value with repect to the finish. To
start the animation just barely outside the view box, we want the negative value
of the static `cy` position and subtract the `cellSize`. The end position is
simply 0—no change from the given `cy` coordinate.

```javascript
const fromParams = {
  y: (-1 * (this.centerY + this.cellSize))
};

const toParams = {
  y: 0,
  ease: Bounce.easeOut,
  onComplete: done,
};
```

The `toParams` also accept an `ease` property, for which we'll use GSAP's
`Bounce.easeOut`, and an `onComplete` callback property, which will be the
`done` callback provided by Vue transition's `enter` hook. This will allow us to
prevent changes in game state until the checker has finished animating.

We also can play with the `duration` property. As we add more checkers to a
single column, each checker will have a shorter distance to fall. If we
otherwise kept the duration the same for all checkers, they would appear to fall
more slowly as they had less distance to fall.

Finding a duration that feels right takes a little trial and error, but where we
currently have it, the duration is an arbitrary constant multiplied by a
percentage of the total column height based on where the checker will end up:

```
const percentage = (this.rowCount - this.row) / this.rowCount;
const duration = return 0.2 + 0.4 * this.percentage;           // seconds
```

## Showtime

Putting this altogether, our final `enter` method looks like this:

```
const BoardChecker = Vue.component('board-checker', {
  // ...

  methods: {
    enter(el, done) {
      // start above board, outside the view box
      const fromY = -1 * (this.centerY + this.cellSize);

      // finish at the position given to
      const toY = 0;

      const fromParams = {
        y: fromY
      };

      const toParams = {
        y: toY,
        ease: Bounce.easeOut,
        onComplete: done,
      };

      const percentage = (this.rowCount - this.row) / this.rowCount;
      const duration = return 0.2 + 0.4 * this.percentage; // arbitrary constants

      return TweenMax.fromTo(el, this.duration, fromParams, destParams);
    },
  },
});
```

Adding this to our game board, we now have some nicely animated checkers falling
into place as we play! Note that, because we're using SVG pattern masking, as
described in [an earlier post](), the checkers appear to fall behind the Connect
Four wall, visible through the portholes.

<p data-height="485" data-theme-id="light" data-slug-hash="jYxxGv" data-default-tab="js,result" data-user="rossta" data-embed-version="2" data-pen-title="Connect Four in Vue.js, SVG: animated checkers" class="codepen">See the Pen <a href="https://codepen.io/rossta/pen/jYxxGv/">Connect Four in Vue.js, SVG: animated checkers</a> by Ross Kaffenberger (<a href="https://codepen.io/rossta">@rossta</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

<hr />

Cool!

Notice though, that you can continue dropping checkers until the board fills up. In the [next post](/blog/finding-four-in-a-row-ftw.html), we'll fix that by introducing an algorithm to check for a win and display the results in the UI when the game ends.
