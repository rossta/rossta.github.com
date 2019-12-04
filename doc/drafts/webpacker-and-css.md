### What about CSS?

No problem! Webpack isn't just for JavaScript. In Sprockets, land, you might have had an application.css bundle alongside your application.js.

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

When folks move from Sprockets
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
    site.css          # not an entry point!
  javascript/
    packs/
      application.js  # just one entry point
```
Move your stylesheets to any directory outside of `app/javascript/packs`. Use what ever names you want for the folder or files, it doesn't matter.

Now you import the stylesheet(s) from anywhere inside your javascript.

```css
/* application.js */
import '../../stylesheets/site.css'
```
> You can configure Webpack to avoid directory traversal in imports '../../stylesheets'; look out for a future post.

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

You don't need an `application.css` file. Let Webpack figure out the dependency graph. This can help, among other things, de-duplicate overlapping modules used on one page. Same goes for CSS.

### Summary

If you take away anything from this article key point: **one entry per page**. If you use
