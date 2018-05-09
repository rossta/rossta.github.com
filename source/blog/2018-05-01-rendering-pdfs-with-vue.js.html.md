---
title: Rendering PDFs with Vue.js
author: Ross Kaffenberger
published: false
summary: Embed documents in your HTML
description: This tutorial demonstrates how to create Vue.js components that can render PDFs along with tools like Webpack, PDF.js, and the canvas element.
pull_image: 'blog/stock/rafaela-biazi-typewriter-unsplash.jpg'
pull_image_caption: Photo by Rafaela Biazi on Unsplash
series:
category: Code
tags:
  - Vue
  - Webpack
---

I remember a time not too long ago when the possibility of rendering PDFs inline on a web page would have sounded crazy. Then [PDF.js](https://mozilla.github.io/pdf.js/) came along and changed all that.

I was recently tasked with just this sort of project and I leveraged Vue.js and Webpack to put it all together. This post will demonstrate a simplified version of how I used Vue to render pages of existing PDFs to `<canvas>` elements. For a more full-featured implementation of PDF rendering in Vue, check out the [vue-pdf](https://github.com/FranckFreiburger/vue-pdf) package. For my project, I used with Vue.js `^2.5.0`, Webpack `^3.11.0`, and PDF.js `^1.10.0`; it may or may not work as described with different versions.

### An incomplete intro to PDF.js

Before we dive into the Vue implementation, a little introduction to the PDF.js api is useful. PDF.js is a JavaScript project by Mozilla that makes it easier to parse and render PDFs in HTML. It is comprised of three key pieces: Core, Display, and Viewer.

The Core layer is the lower level piece that parses and interprets PDFs for use by the other layers. This code is split out into a separate file, `pdf.worker.js`, which will run in its own web worker thread in the browser. Since we're using Webpack, it will handle bundling, fetching, and configuration of the worker script behind the scenes.

The Viewer layer provides a basic user interface for viewing and paging through PDFs in Firefox (or other browsers with included extensions). We won't be using this piece; in fact, this tutorial could be used as the basis for a Vue.js implementation of alternative viewer.

Most of our interaction with the PDF.js library will be at the Display layer, which provides the JavaScript API for retrieving and manipulating PDF document and page data. The API relies heavily on Promises, which we'll be incorporating into our Vue.js components. We'll also take advantage of dynamic imports to code split our use of PDF.js, since, at least for my purposes, I only want to load the PDF.js library on demand. Keeping it out of the main application Webpack bundle will help keep the initial page load time small.

### Using PDF.js

Here's a basic ES6 example of dynamically loading PDF.js to render an entire PDF document (without Vue):

```javascript
import range from 'lodash/range'

import('pdfjs-dist/webpack').then(pdfjs => {
  pdfjs
    .getDocument('wibble.pdf')
    .then(pdf => {
      const pagePromises = range(1, pdf.numPages).map(number => pdf.getPage(number))
      return Promise.all(pagePromises)
    })
    .then(pages => {
        const scale = 1.5

        const canvases = pages.forEach(page => {
          const viewport = page.getViewport(scale)

          // Prepare canvas using PDF page dimensions
          const canvas = document.createElement('canvas')
          canvas.height = viewport.height
          canvas.width = viewport.width

          // Render PDF page into canvas context
          const canvasContext = canvas.getContext('2d')
          const renderContext = { canvasContext, viewport }
          page.render(renderContext).then(() => console.log('Page rendered'))

          document.body.appendChild(canvas)
        })
      },
      error => console.log('Error', error),
    )
})
```
The code above dynamically imports the PDF.js distribution with `import('pdfjs/dist')`. Webpack will split the PDF.js code out into its own bundle and load it asynchronously only when that line is executed in the browser. This expression returns a promise that resolves with the PDF.js module when the bundle is successfully loaded and evaluated. With a reference to the modules, `pdfjs` we can now exercise the PDF.js document API.

The expression `pdjs.getDocument('url-to-pdf')` also returns a promise which resolves when the the document is loaded and parsed by the PDF.js core layer. This promise resolves to an instance of [`PDFDocumentProxy`](https://mozilla.github.io/pdf.js/api/draft/PDFDocumentProxy.html), which we can use to retrieve additional data from the PDF document. We used the `PDFDocumentProxy#numPages` attribute to build a number range of all the pages (using lodash `range`) and build an array of promises representing requests for each of the documents pages returned by `PDFDocumentProxy#getPage(pageNumber)`. The key here to loading all pages at once is using `Promise.all` to resolve when all pages are retrieved as [PDFPageProxy](https://mozilla.github.io/pdf.js/api/draft/PDFPageProxy.html) objects.

Finally, for each page object, we create a separate `canvas` element and trigger the `PDFPageProxy#render` method, which returns another promise and accepts options for a canvas context and viewport. This render method is responsible for drawing the PDF data into the canvas element asynchronously while we append the canvas elements to `document.body`.

### Refactoring to Vue

So far we have a basic, imperative snippet to render a PDF. While it works, adding new features, like paging controls, zoom buttons, and conditional page rendering on scroll, could get unwieldy quickly. By refactoring to Vue components, we can get the benefit of reactivity and make our code more declarative and easier to extend.

In pseudcode, our component architecture will resemble this:

```html
<PDFDocument>
  <PDFPage :number="1" />
  <PDFPage :number="2" />
  <PDFPage :number="3" />
  ...
</PDFDocument>
```

### The document component

Since PDF.js will request data via an XMLHTTPRequest in JavaScript, typical crossdomain restrictions apply. For the purposes of this tutorial, we'll assume we have a URL to a PDF that can be retrieved either from our development server or from a server that allows Cross-Origin Resource Sharing (CORS) from our host.
