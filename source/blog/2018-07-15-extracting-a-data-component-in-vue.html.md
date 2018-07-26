---
title: Extracting a data component in Vue
author: Ross Kaffenberger
published: true
summary: Building a PDF Viewer with Vue - Part 3
description: In this tutorial, we'll illustrate the general benefits of extracting data components in Vue.js applications and apply this approach to the PDF viewer application so that multiple child components can share fetched PDF page data.
series: 'PDF Viewer'
category: Code
tags:
  - Vue
---
Vue components don't have to just be about displaying information and user interaction. In this post, we'll show how to build a component whose main job is to simply fetch data for other components. We'll use props, events, and scoped-slots to tie the pieces together.

### The project
This post is part of ongoing series, [Building a PDF Viewer with Vue.js](/blog/series/pdf-viewer.html). The source code for this project is on Github at [rossta/vue-pdfjs-demo](https://github.com/rossta/vue-pdfjs-demo). To see the source described in this post, [checkout the branch](https://github.com/rossta/vue-pdfjs-demo/tree/tutorial/part-3-renderless-components).

Here's the latest [project demo](https://rossta.net/vue-pdfjs-demo/).

### Catching up from last time
So far in [this series](/blog/series/pdf-viewer.html), we have built a simple PDF viewer to render the pages of PDF document to `<canvas>` elements with Vue. We have also updated our components to fetch and render PDF pages lazily as they are scrolled into the viewport. For the next feature, we want to build a preview pane into the left-hand side of the viewer.

![Preview of the preview](screenshots/screenshot-pdf-viewer-part-3.jpg)

This preview pane will display the entire document (as smaller, clickable thumbnails), be independently-scrollable, and render PDF pages lazily—in other words. In other words, it will behave a lot like our current `<PDFDocument>`. First, we'd like to make some of our current code reusable.

### The why
The Vue docs provide helpful examples for using [mixins](https://vuejs.org/v2/guide/mixins.html), [custom directives](https://vuejs.org/v2/guide/custom-directive.html), and more. My preferred approach for sharing component functionality is *composition*, which means extracting shared code into separate components. In this post, we'll be using composition to reuse data fetching.

Why composition? This topic deserves a separate post. For one, it's my preference, along the lines of general object-oriented programming advice, for "composition over inheritance". Practically, in Vue, this means I'd like to think "component-first", before reaching for mixins or `extends` (these are basically forms of inheritance). I also agree with the drawbacks Dan Abramov enumerates in [Mixins Considered Harmful](https://reactjs.org/blog/2016/07/13/mixins-considered-harmful.html); though the context for his post is React, most of his points are relevant to Vue as well.

It's also worth noting that we're not currently using [Vuex](https://vuex.vuejs.org) to manage application state in the project. It may be wise, as an alternative to what's described in this post, to introduce Vuex to fetch data by dispatching actions and triggering state mutations at the appropriate times. However, at this point, our data flow is fairly straightforward, top-to-bottom, which, in my opinion, favors the component-first approach. It's also simply a worthy exercise to consider data components.

### Bird's eye view
Let's take a look at where we are and where we want to go. Prior to adding our feature, our component hierarchy looks like the following pseudocode:
```html
<PDFDocument>
  <PDFPage />
  <PDFPage />
  <PDFPage />
  ...
</PDFDocument>
```
For our new preview feature, our preview and document components will live side-by-side.
```html
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
```
Our `<PDFPreview>` needs access to the same PDF data as our `<PDFDocument>`. While we could reuse the data fetching code we wrote previously as a mixin, there's a clear problem with that approach. It would mean the components would fetch the same data independently—which is potentially some wasted work.

While this may be desired for some applications, we'd prefer to only fetch the PDF page data once. To achieve this, we're going to wrap both the `<PDFPreview>` and `<PDFThumbnail>` in another component, whose only responsibility will be to respond to events to request page data, which it will pass to its children as props. With this approach, there is only one data source shared by the two display components.

So our heirarchy will eventually look like this:
```html
<PDFData> <!-- passes page data to children -->

  <PDFPreview> <!-- emits events to request more pages -->
    ...
  </PDFPreview>
  <PDFDocument> <!-- emits events to request more pages -->
    ...
  </PDFDocument>

</PDFData>
```
Here we will have decoupled the logic for batching and requesting page data over the wire from the interactions and events that will trigger that behavior. For our viewer, either our document or future preview components can trigger data fetching. The data component needs to know nothing about the scrolling behavior or the logic that determines when additional pages are needed.

Next we'll take a look at how this data component is constructed and how it will pass data to the child components.

### Extracting the data component
Currently, the data fetching logic resides in our `<PDFDocument>` component. There is a method that encapsulates the logic for [fetching pages in batches](https://github.com/rossta/vue-pdfjs-demo/blob/4be84574ce6837379dd90b4d68194ea19b172734/src/components/PDFDocument.vue#L145), [watchers](https://github.com/rossta/vue-pdfjs-demo/blob/4be84574ce6837379dd90b4d68194ea19b172734/src/components/PDFDocument.vue#L177) for responding to changes in the given `url` prop and `pdf` proxy object, and relevant `data` and `computed` properties for maintaining the state of PDF data. You can see [the previous post](https://rossta.net/blog/building-a-pdf-viewer-with-vue-part-2.html) for more info on the implementation details. We'll move this functionality to a new `<PDFData>` component:

```javascript
// src/components/PDFData.vue

props: {
  url: {
    type: String,
    required: true,
  },
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
This component will be "renderless"* (almost), meaning it will delegate rendering to its children. We'll use scoped slots to pass the `this.pages` data to the preview and document components. The `<PDFData>` needs to nothing about its children, only that it will pass data to its named children, `preview` and `document`, in its own render function:

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

### Communicating with the children
In the `<PDFViewer>` we can use the `slot` attribute to render the children in the correct place and `slot-scope` to receive the `pages` property from the `<PDFData>` component. Though we haven't created the `<PDFPreview>` components, here's our template for the `<PDFViewer>` responsible for gluing everything together.
```html
<!-- src/components/PDFViewer.vue -->

<template>
  <PDFData>
    <!-- At this point in the tutorial, PDFPreview
    doesn't exist, but this is where it will go. -->
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
### Wrapping up
That does it! We've extracted data fetching logic completely out of the `<PDFDocument>` into the `<PDFData>`. We've avoided the [drawbacks of introducing mixins](https://reactjs.org/blog/2016/07/13/mixins-considered-harmful.html) to share behavior. Our new data component will show up separately in the Vue dev tools extension for better debugging. The application is also easier to extend so we can now add new functionality, like the preview pane. We also have a nice alternative to Vuex, which would be a new dependency, to managing a portion of our application state.

In the next post, we'll look at extracting shared behavior so that both our preview and document components can be independently scrollable and either can trigger additional data-fetching when the scrolled to the bottom.
