### A Guide

Webpack isn't just for bundling JavaScript. While it's currently possible to use Webpacker and Sprockets side-by-side

In Sprockets, land, you might have an `application.css` declared separately along with your application.js.

```shell
app/
  assets/
    javascripts/
      application.js
      ...
    stylesheets/
      application.scss
      ...
```


```shell
app/
  javascript/
    packs/
      application.js   # entry point 1
      application.css  # entry point 2
```

This isn't necessary. Here's an approach you can start with instead:

```shell
app/
  stylesheets/
    main.css          # not an entry point!
  javascript/
    packs/
      application.js  # just one entry point
```
Move your stylesheets to any directory outside of `app/javascript/packs`. Use what ever names you want for the folder or files, it doesn't matter.

Now you import the stylesheet(s) from anywhere inside your javascript.

```css
/* application.js */
import '../stylesheets/main.css'
```

That's right, import your CSS from JavaScript. From anywhere, including from deep in the JS tree, co-located with components:

```shell
app/
  javascript/
    components/
      Header/
        index.js
        index.css
      Sidebar/
        index.js
        index.css
```
```javascript
// Header/index.js
import '../index.css'
```

You don't need an `application.css` file. Let webpack figure out the dependency graph. This can help, among other things, de-duplicate overlapping modules used on one page. Same goes for CSS.


### Configuration

In your `config/webpacker.yml` file, you likely want this flag set in `production`:

```
extract_css: true
```

Meaning: for every javascript entry point, pull its imported css out into a separate css file by the same name.

When using `extract_css: true`, you'll need the stylesheet tag: `stylesheet_pack_tag 'application'`.

```
extract_css: false
```

### Summary

If you take away anything from this article key point: **one entry per page**. If you use
