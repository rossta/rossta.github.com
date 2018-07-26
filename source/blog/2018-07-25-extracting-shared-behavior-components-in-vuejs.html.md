---
title: Extracting shared behavior components in Vue.js
author: Ross Kaffenberger
published: false
summary: Extracting shared behavior components in Vue.js
description: Extracting shared behavior components in Vue.js
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

### Adding scrolling components
At this point, we've extracted logic for fetching and paging PDF data to a component that will pass `pages` props to its children, the `<PDFDocument>` and our soon-to-be `<PDFPreview>` components. For the next phase, we're going to move the functionality related to scrolling to another set of components. This functionality includes detecting when to fetch additional pages, determining whether a page is visible based on its scroll position, and determining whether or not a page is "in focus" within the view port.

Extracting this functionality presents an interesting challenge because it is currently split between the `<PDFDocument>` and `<PDFPage>` components. This means that we'll be moving the behavior to two separate generalized components, both of which we will use to compose the updated document component and new preview component.

The `<PDFDocument>` currently keeps track of the `scrollTop` and the `clientHeight` properties of its containing element within which the pages while `didReachBottom` is updated as the bottom of the document is scrolled into the viewport.
```javascript
// src/components/ScrollingDocument.vue

props: ['pages'],

data() {
  return {
    scrollTop: 0,
    clientHeight: 0,
    didReachBottom: false,
    // ...
  };
},

// ...
```

Since Vue can't natively watch properties of the DOM, we also add behavior to update the component data through a `scroll` event listener on the component's element, which we attach in the `mounted` hook. We now move this functionality new component, `<ScrollingDocument>`, which we will use to compose our `<PDFDocument>`.
```javascript
// src/components/ScrollingDocument.vue

import throttle from 'lodash/throttle';

export default {
  // ...

  methods: {
    updateScrollBounds() {
      const {scrollTop, clientHeight} = this.$el;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
      this.didReachBottom = this.isBottomVisible();
    },

    isBottomVisible() {
      const {scrollTop, clientHeight, scrollHeight} = this.$el;
      return scrollTop + clientHeight >= scrollHeight;
    },
  },

  mounted() {
    this.updateScrollBounds();
    this.$el.addEventListener('scroll', throttle(this.updateScrollBounds, 300), true);
  },

// ...
```
We also have watchers to trigger additional behavior:
```javascript
// src/components/ScrollingDocument
methods: {
  // ...

  fetchPages() {
    this.$emit('pages-fetch');
  },
},

watch: {
  didReachBottom(didReachBottom) {
    if (didReachBottom) this.fetchPages();
  },
  // ...
},
// ...
```
We'll start with a simple template that passes the `scrollTop` and `clientHeight` data to a `<slot>` component as props; these are required for the `<PDFPage>` component to determine if it's relationship to the viewport.
```html
<!-- src/components/ScrollingDocument.vue -->
<template>
  <div class="scrolling-document">
    <slot v-bind="{scrollTop, clientHeight}" />
  </div>
</template>
```
We remove the scrolling functionality from the `<PDFDocument>` since it is now recreated in the `<ScrollingDocument>` and import the component instead.
```javascript
// src/components/PDFDocument

import ScrollingDocument from './ScrollingDocument';

export default {
  components: {
    ScrollingDocument,
  },

  // removed scrolling functionality ...
};
```
The in-progress template for `<PDFDocument>` now would look like this:
```html
<template>
  <ScrollingDocument
    class="pdf-document scrolling-document"
    v-bind="{pages}"
    >
    <PDFPage
      slot-scope="{scrollTop, clientHeight}"
      v-for="page in pages"
      v-bind="{scale, page, scrollTop, clientHeight}"
      :key="page.pageNumber"
    />
  </ScrollingDocument>
</template>
```
Note the contrast in this approach with extracting a mixin. While we could accomplish the goal of code-sharing, it comes at the cost of implicit dependencies, potential name clashes, and other aspects of mounting complexity we noted earlier.
