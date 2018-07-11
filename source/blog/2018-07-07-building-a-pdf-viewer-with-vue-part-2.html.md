---
title: Displaying PDFs lazily with Vue
author: Ross Kaffenberger
published: true
summary: Building a PDF Viewer with Vue - Part 2
description: This tutorial demonstrates how to use Vue to defer fetching and rendering of PDF page data until elements are scrolled into the client browser.
pull_image: 'blog/stock/rawpixel-typewriter-unsplash.jpg'
pull_image_caption: Photo by rawpixel on Unsplash
series: 'PDF Viewer'
category: Code
tags:
  - Vue
---

As we demonstrated in the [previous post](/blog/building-a-pdf-viewer-with-vue-part-1.html), we can render pages of a PDF to `<canvas>` elements using PDF.js and Vue. We were able to use a simple Vue component hierarchy to separate the responsibilities of data fetching and page rendering. We used the PDF.js library to fetch the page data and hand off the work of drawing the data onto `<canvas>` elements.

In this post, we'll add a new requirement: we should only render pages when they are visible, i.e., as they are scrolled into the viewport. Previously, we were rendering all pages eagerly, regardless of whether they were appearing in the client browser. For a large PDF, this could mean valuable resources are used to render many pages offscreen and may never be viewed. Let's see how we can fix that using Vue.

The latest source code for this project is on Github at [rossta/vue-pdfjs-demo](https://github.com/rossta/vue-pdfjs-demo). To see the version of the project described in this post, [checkout the `part-2-scrolling` branch](https://github.com/rossta/vue-pdfjs-demo/tree/tutorial/part-2-scrolling). Here's the [project demo](https://rossta.net/vue-pdfjs-demo/):

[![Demo](screenshots/screenshot-pdf-viewer.png)](https://rossta.net/vue-pdfjs-demo/)

### Adding scroll behavior

To review, once a `<PDFPage>` component mounts, it calls the `page.render` method to draw the PDF data to the `<canvas>` element. To defer page rendering, this method should only be called once the `<canvas>` element has become visible in the scroll window of the document. We'll detect visibility of the page by inferring from the scroll boundaries or the parent component, `<PDFDocument>` along with the position and dimensions of the child `<PDFPage>` components.


First, a CSS change to make our document scrollable within a relatively positioned parent element.

```css
.pdf-document {
  position: absolute;
  overflow: auto;
  width: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
```
The `<PDFDocument>` will track its visible boundaries using the `scrollTop` and `clientHeight` properties of its element. We'll record these boundaries when the component mounts.
```javascript
// src/components/PDFDocument.vue

  data() {
    return {
      scrollTop: 0,
      clientHeight: 0,
      // ...
    };
  },

  methods: {
    updateScrollBounds() {
      const {scrollTop, clientHeight} = this.$el;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
    },

    // ...
  },

  mounted() {
    this.updateScrollBounds();
  },

  // ...
}
```
The `scrollTop` according to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop):
> An element's `scrollTop` value is a measurement of the distance from the element's top to its topmost *visible* content.

The `clientHeight` according to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight):
> The `clientHeight` read-only property is zero for elements with no CSS or inline layout boxes, otherwise it's the inner height of an element in pixels, including padding but not the horizontal scrollbar height, border, or margin.

Used together, we can determine what portion of the document is visible to the user.

### Detecting page visibility

The `<PDFPage>` component will track the boundaries of its underlying canvas element, whose dimensions we demonstrated how to calculate in the previous post. As with the document component, we'll trigger the update of this data property when the page component mounts:

```javascript
// src/components/PDFPage.vue

  data() {
    return {
      elementTop: 0,
      elementHeight: 0,
      // ...
    };
  },

  methods: {
    updateElementBounds() {
      const {offsetTop, offsetHeight} = this.$el;
      this.elementTop = offsetTop;
      this.elementHeight = offsetHeight;
    },

    // ...
  },

  mounted() {
    this.updateElementBounds();
  },

  // ...
```
The element's `offsetTop` property will represent the distance from its top boundary to that of the containing document element `div`. Recording its `offsetHeight` enables us to determine how far the bottom of the element is from the top of the container.

Note that the `updateElementBounds` and `updateScrollBounds` methods are necessary because properties of DOM elements are outside of Vue's control, i.e., they are not reactive. These methods exist to maintain reactive copies of these properties in Vue and we must trigger them somehow when scrolling or resizing the window so that the changes will propagate.

Since we can pass the scroll data of the parent component to the child page components as props, we now have what we need to determine if a given page is visible in the scroll area of the document.
```javascript
// src/components/PDFPage.vue

  props: {
    scrollTop: {
      type: Number,
      default: 0
    },
    clientHeight: {
      type: Number,
      default: 0
    },

    // ...
  },

  computed: {
    isElementVisible() {
      const {elementTop, elementBottom, scrollTop, scrollBottom} = this;
      if (!elementBottom) return;

      return elementTop < scrollBottom && elementBottom > scrollTop;
    },

    elementBottom() {
      return this.elementTop + this.elementHeight;
    },

    scrollBottom() {
      return this.scrollTop + this.clientHeight;
    },
    // ...
  },

  // ...
```
We'll use a computed property `isElementVisible` which will update whenever either the `scrollBounds` or `elementBounds` change. It will simply check if the top of the element is above the bottom of the scroll area (`top < scrollBottom`) and the bottom of the element is below the top of the scroll area (`bottom > scrollTop`). Note that the `y` dimension increases moving down the screen.

For another approach to detecting visibility in Vue, checkout the [Akryum/vue-observe-visibility](https://github.com/Akryum/vue-observe-visibility) on Github, which is also available as an NPM package.

### Lazy rendering pages

Previously, we called the `drawPage` method (described in the [previous post](https://rossta.net/blog/building-a-pdf-viewer-with-vue-part-1.html#rendering-the-page)) when the page component mounted. To make the page render lazily, now we call the method only when the element becomes visible, using a watcher.
```javascript
// src/components/PDFPage.vue

  watch: {
    isElementVisible(isElementVisible) {
      if (isElementVisible) this.drawPage();
    },
  },

  // ...
```
We've defined `drawPage` such that it will only render once if called multiple times.

In the page components, we can simply watch for changes in scroll boundaries and scale—changes to these props may cause a previously "hidden" page to become visible in the browser.

```javascript
// src/components/PDFPage.vue

  watch: {
    scale: 'updateElementBounds',
    scrollTop: 'updateElementBounds',
    clientHeight: 'updateElementBounds',
    // ...
  },

  // ...
```
For the document component, we add listeners to DOM events to trigger the `updateScrollBounds` method within the `mounted` hook.
```javascript
// src/components/PDFDocument.vue
import throttle from 'lodash/throttle';

export default {
  // ...

  mounted() {
    this.updateScrollBounds();
    const throttledCallback = throttle(this.updateScrollBounds, 300);

    this.$el.addEventListener('scroll', throttledCallback, true);
    window.addEventListener('resize', throttledCallback, true);

    this.throttledOnResize = throttledCallback;
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.throttledOnResize, true);
  },

  // ...
```
A few notes about the implementation above: we use lodash's `throttle` function to ensure our callback is only triggered once every 300ms; otherwise, we'd be making this update potentially dozens of times a second, which for our purposes is unnecessary and could potentially be a performance bottleneck. Since we can attach our `throttledCallback` to the `'scroll'` event listener of `this.$el`, we will also be cleaned up nicely during Vue teardown phase. However, since the `'resize'` event will currently only work on the `window`, we'll need to store a reference to the throttled callback as `this.throttledOnResize` so we can remove the event listener in Vue's `beforeDestroy` hook.

For a great explanation of throttling (and its cousin, debouncing) event callbacks, check out [this post on CSS tricks](https://css-tricks.com/debouncing-throttling-explained-examples/).

### Adding "infinite" scrolling

So far we have deferred rendering individual pages to mounted canvas elements until scrolled into view. This allows us to spare CPU cycles at the cost of the brief visual delay as newly visible pages are drawn. However, we are still creating the `<PDFPage>` components for every PDF page, regardless of whether they are visible. This results in `n - visible` blank `<canvas>` elements below the fold.

We can go one step further. Instead of fetching all the pages up front, we'll fetch pages in batches as the user scrolls to the bottom of the document. In other words, we'll implement "infinite scrolling" for PDF pages (though most PDFs of which I'm aware are finite in length). Fetching in batches is a compromise between eagerly loading all pages and fetching one at a time.

To keep things simple for this tutorial, we'll add batching directly to the `<PDFDocument>` component; in a future post, we'll extract this information to other parts of our application.

### Batched fetching

Recall in our document component, we're tracking a `pdf` property and an array of `pages`. We now add a `cursor` to represent the highest page number in the document we've attempted to fetch. We also will track the expected `pageCount` using a property provided by the `pdf` object.

```javascript
// src/components/PDFDocument.vue
  data() {
    return {
      pdf: undefined,
      pages: [],
      cursor: 0,
      // ...
    };
  },

  computed: {
    pageCount() {
      return this.pdf ? this.pdf.numPages : 0;
    },

    // ...
  },

  // ...
```

We also previously added a watcher for the `pdf` property to fetch all pages:

```javascript
// src/components/PDFDocument.vue

  watch: {
    pdf(pdf) {
      this.pages = [];
      const promises = range(1, pdf.numPages).
        map(number => pdf.getPage(number));

      Promise.all(promises).
        then(pages => (this.pages = pages));
    },
  },
```
We'll modify this watcher by extracting a method to fetch pages in batches:
```javascript
// src/components/PDFDocument.vue

  watch: {
    pdf(pdf) {
      this.pages = [];
      this.fetchPages();
    },
  },
```
Here is our new `fetchPages` implementation:
```javascript
// src/components/PDFDocument.vue

const BATCH_COUNT = 10;

export default {
  // ...

  methods: {
    fetchPages() {
      if (!this.pdf) return;

      const currentCount = this.pages.length;
      if (this.pageCount > 0 && currentCount === this.pageCount) return;
      if (this.cursor > currentCount) return;

      const startPage = currentCount + 1; // PDF page numbering starts at 1
      const endPage = Math.min(currentCount + BATCH_COUNT, this.pageCount);
      this.cursor = endPage;

      getPages(this.pdf, startPage, endPage)
        .then((pages) => {
          this.pages.splice(currentCount, 0, ...pages);
          return this.pages;
        })
        .catch((response) => {
          this.$emit('document-errored');
        });
    },

    // ...
  }

  // ...
```
The added complexity in `fetchPages` allows us to request small batches of pages with each subsequent call. The `currentCount` represents the total number of pages that have already been fetched. The `startPage` is simply the next page number of the next would-be page in the array, and the `endPage` of the batch is the lesser of an arbitrarily small batch of pages (`BATCH_COUNT`) and the remaining pages. We're able to insert these pages in the correct location in the tracked pages array with `this.pages.splice(currentCount, 0, ...pages)`. We also use the `this.cursor` property to track the most recently request `endPage` to ensure the same batch is only requested once.

### Why splice?

You may ask, why not simply add the new pages on to the end of the `this.pages` array instead? You could imagine using an expression like `this.pages.push.apply(this.pages, pages)` to modify the array in place or replacing the array altogether with `this.pages = [...this.pages, ...pages]` or `concat`. The reason is that `getPages` is asynchronous—it returns a promise that fulfills when all pages in the batch have been fetched. It is safer to assume this method can be called in rapid succession where multiple batch requests may be in flight simultaneously. Using `splice` to add new pages at the expected position will ensure our batches are inserted into the `this.pages` array in the correct order.

### Finding the bottom

To determine whether the user has scrolled to the bottom of the last of the fetched pages, we will again lean on properties of `this.$el`. We can ask if the sum of the `scrollTop` of the document and its visible height, `clientHeight`, has equalled its total `scrollHeight`.

```javascript
// src/components/PDFDocument.vue

  methods: {
    isBottomVisible() {
      const {scrollTop, clientHeight, scrollHeight} = this.$el;
      return scrollTop + clientHeight >= scrollHeight;
    },

    // ...
  },
```
We'll call this method during `updateScrollBounds` method and record a tracked a true/false property, `didReachBottom`.
```javascript
// src/components/PDFDocument.vue

  data() {
    return {
      didReachBottom: false,
      // ...
    };
  },

  methods: {
    updateScrollBounds() {
      const {scrollTop, clientHeight} = this.$el;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
      this.didReachBottom = this.isBottomVisible();
    },

    // ...
  },

  // ...
```
We can then use a watcher to call `fetchPages` if this property flips from `false` to `true`. This watcher would fire continuously in a cycle as the user scrolls to the bottom and more pages are fetched.
```javascript
// src/components/PDFDocument.vue

  watch: {
    didReachBottom(didReachBottom) {
      if (didReachBottom) this.fetchPages();
    },

    // ...
  },

  // ...
```

For another in-depth look at adding infinite scrolling for Vue, check out Chris Nwamba's [post on Scotch.io](https://scotch.io/tutorials/simple-asynchronous-infinite-scroll-with-vue-watchers). There are also a number of packages that abstract infinite scrolling if you'd prefer to lean on open source, including [Akryum/vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) and [ElemeFE/vue-infinite-scroll](https://github.com/ElemeFE/vue-infinite-scroll).

### Wrapping up

We've succeeded in making our documents more lazy; now we can defer both data fetching and page rendering until necessary, potentially improving performance of the initial page load and avoiding waste, especially for large documents.

We've been adding quite a bit of complexity though to our existing `<PDFDocument>` and `<PDFPage>` components; they now both are responsible for making API requests, calculating element boundaries, lazy behavior, etc. Ideally, we'll want to limit the responsibility of a given component to make our application less resistant to change. In the next post, we'll refactor our PDF viewer to to separate out data fetching and scrolling behavior into separate "renderless components". These changes will subsequently allow us to share code and add a new feature: a preview pane.

And now you've reached the bottom of this post!
