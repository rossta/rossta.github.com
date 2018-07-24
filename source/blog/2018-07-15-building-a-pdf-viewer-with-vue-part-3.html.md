---
title: Extracting shared code with renderless components
author: Ross Kaffenberger
published: false
summary: Building a PDF Viewer with Vue - Part 3
description:
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Vue
---
So far in [this series], we have built a simple PDF viewer to render the pages of PDF document to `<canvas>` elements with Vue. We have also updated our components to fetch and render PDF pages lazily as they are scrolled into the viewport. For the next feature, we'll build a preview pane into the left-hand side of the viewer.

![diagram]()

It will also display the entire document as smaller thumbnails, be independently-scrollable, and should fetch and render PDF pages lazily—in other words, it will behave a lot like our current components. This means we should be able to re-use much of the code we've written so far. But how?

The Vue docs provide helpful examples for using [mixins](https://vuejs.org/v2/guide/mixins.html), [custom directives](https://vuejs.org/v2/guide/custom-directive.html), and more. My preferred approach for sharing component functionality is *composition*, which means extracting shared code into separate components. In this post, we'll be using composition to reuse data fetching and scrolling behavior for the new preview feature.

Why composition? This topic deserves a separate post, but for now, I'll link to Dan Abramov's [Mixins Considered Harmful](https://reactjs.org/blog/2016/07/13/mixins-considered-harmful.html). Though the context for his post is React, most of his points are relevant to Vue as well.

Prior to adding our feature, our component hierarchy looks like the following pseudcode:
```html
<PDFDocument>
  <PDFPage />
  <PDFPage />
  <PDFPage />
  ...
</PDFDocument>
```
To support the new preview feature, we'll wrap our document in a "viewer" component to glue our children together, so our new component tree will look close to this:
```html
<PDFViewer>
  <PDFPreview>
    <PDFThumbnail />
    <PDFThumbnail />
    <PDFThumbnail />
    ...
  </PDFPreview>
  <PDFDocument>
    <PDFPage />
    <PDFPage />
    <PDFPage />
    ...
  </PDFDocument>
</PDFViewer>
```
Our `<PDFPreview>` needs access to the same PDF data as our `<PDFDocument>`. While we could reuse the data fetching code we wrote previously as a mixin, there's a clear problem with that approach. It would mean the components would fetch the same data independently—which is potentially some wasted work.

While this may be desired for some applications, we'd prefer to only fetch the PDF page data once. To achieve this, we're going to wrap both the `<PDFPreview>` and `<PDFThumbnail>` in another component, whose only responsibility will be to respond to events to request page data, which it will pass to its children as props. With this approach, there is only one data source shared by the two display components.

### Adding a data component

Currently, the data fetching logic resides in our `<PDFDocument>` component. There is a method that encapsulates the logic for [fetching pages in batches](https://github.com/rossta/vue-pdfjs-demo/blob/4be84574ce6837379dd90b4d68194ea19b172734/src/components/PDFDocument.vue#L145), [watchers](https://github.com/rossta/vue-pdfjs-demo/blob/4be84574ce6837379dd90b4d68194ea19b172734/src/components/PDFDocument.vue#L177) for responding to changes in the given `url` prop and `pdf` proxy object, and relevant `data` and `computed` properties for maintaining the state of PDF data. You can see [the previous post](https://rossta.net/blog/building-a-pdf-viewer-with-vue-part-2.html) for more info on the implementation details. We'll move this functionality to a new `<PDFData>` component:

```javascript
// src/components/PDFData.vue

props: {
  url: {
  type: String,
  required: true,
},

data() {
  return {
    pages: undefined,
    pages: [],
    cursor: 0,
    // ...
  };
},

methods: {
  fetchPages() {
    // fetches next batch and appends to this.pages
  },
},

computed: {
  pageCount() {
    return this.pdf ? this.pdf.numPages : 0;
  },
},

// ...
```
This component will be "renderless"*, meaning it will delegate rendering to its children. We'll use scoped slots to pass the `this.pages` data to the preview and document components. The `<PDFData>` needs to nothing about its children, only that it will pass data to its named children, `preview` and `document`, in its own render function:

```javascript
// src/components/PDFData.vue

render(h) {
  return h('div', [
    this.$scopedSlots.preview({
      pages: this.pages,
    }),
    this.$scopedSlots.document({
      pages: this.pages,
    }),
  ]);
},

// ...
```

*Technically, this component isn't "renderless"—it inserts an additional `div` as a root to its scoped slots children. Otherwise, the error `Multiple root nodes returned from render function. Render function should return a single root node.` is raised in the current version of Vue I'm using (`2.5.16`). The main point is that we can use components in our component hierarchy that add functionality but handoff display responsibility to its children.

In the `<PDFViewer>` we can use the `slot` attribute to render the children in the correct place and `slot-scope` to receive the `pages` property from the `<PDFData>` component. Though we haven't created the `<PDFPreview>` components, here's our template for the `<PDFViewer>` responsible for gluing everything together.
```html
<!-- src/components/PDFViewer.vue -->

<template>
  <PDFData>
    <PDFPreview
      slot="preview"
      slot-scope="{pages}"
      v-bind="{pages}"
      />
    <PDFDocument
      slot="document"
      slot-scope="{pages}"
      v-bind="{pages}"
      />
  </PDFData>
</template>
```
To trigger data fetching, the `<PDFData>` component will listen for the `pages-fetch` event. Since we're using a render function, we won't be able to use the template syntax for binding to events. Instead, we'll attach the event listener using `this.$on` in the `created` hook:
```javascript
// src/components/PDFData.vue

created() {
  this.$on('pages-fetch', this.fetchPages);
},

// ...
```
Now we need to set up our `<PDFDocument>` to communicate with the `<PDFData>` component. We update `<PDFDocument` to accept `pages` as props now that it is now longer responsible for fetching this data. Its `fetchPages` method, called when the component mounts or during scrolling, we'll leave in place but change its implementation (now owned by its parent `<PDFData>` component) to simply emit the `pages-fetch` event, for which `<PDFData>` is listening.
```javascript
// src/components/PDFDocument.vue
props: {
  pages: {
    type: Array,
    required: true,
  },
},

data() {
  return {
    // removed pages and pdf properties
    // ...
  };
},

methods: {
  fetchPages() {
    this.$emit('pages-fetch');
  },

  // ...
}
```
### Adding scrolling components
At this point, we've extracted logic for fetching and paging PDF data to a component that will pass `pages` props to its children, the `<PDFDocument>` and our soon-to-be `<PDFPreview>` components. For the next phase, we're going to move the functionality related to scrolling to another set of components. This functionality includes detecting when to fetch additional pages, determining whether a page is visible based on its scroll position, and determining whether or not a page is "in focus" within the view port.

Extracting this functionality presents an interesting challenge because it is currently split between the `<PDFDocument>` and `<PDFPage>` components. This means that we'll be moving the behavior to two separate generalized components, both of which we will use to compose the updated document component and new preview component.

The `<PDFDocument>` currently keeps track of the `scrollTop` and the `clientHeight` properties of its containing element within which the pages while `didReachBottom` is updated as the bottom of the document is scrolled into the viewport.
```javascript
// src/components/PDFDocument.vue

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
Of course, Vue can't natively watch properties of the DOM, so we must set up a 'scroll' event listener to update this data periodically.
```javascript
// src/components/PDFDocument.vue

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

The `scrollTop` and `clientHeight` data is passed to the `<PDFPage>` as props:
```html
<!-- src/components/PDFDocument.vue -->
<template>
  <div class="pdf-document">
    <PDFPage
      v-for="page in pages"
      v-bind="{scale, page, scrollTop, clientHeight}"
      :key="page.pageNumber"
  </div>
</template>
```
