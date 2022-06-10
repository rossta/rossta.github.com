---
title: Importing images with Webpacker
author: Ross Kaffenberger
published: true
summary: An unofficial Rails guide
description: "Using images bundled by webpack can get confusing. 'How to reference images from JavaScript? from CSS? from Rails ERB templates? This post will demonstrate."
thumbnail: 'blog/stock/jr-korpa-lights-unsplash.jpg'
thumbnail_caption: Photo by JR Korpa on Unsplash
popular: 4
series:
category: Code
tags:
  - Webpack
  - Rails
type: Guide
---

Webpack isn't just for JavaScript. You can bundle images with it too. [Webpacker](https://github.com/rails/webpacker) makes it relatively easy to work with images, but it is admittedly confusing at first: _Images in JavaScript?_

In this post, we'll demonstrate how to reference Webpacker images from your JavaScript, CSS, and Rails views. The following examples were created using Rails 6 and Webpacker 4, but may work with other versions as well. Pre-requisites for working with Webpacker in a Rails project also include [yarn](https://yarnpkg.com/).

> [Subscribe to my newsletter](/webpack-on-rails/) to learn more about using webpack with Rails.

### Folder structure

First, where should you put your images? It doesn't matter. The easiest place to start is under your `app/javascript` folder, the default source path for Webpacker, such as `app/javascript/images`.

For the rest of this guide, we'll assume the following directory structure and files:
```
app/javascript
├── components
│   └── Taco.js
├── css
│   ├── main.css
├── images
│   ├── burritos.jpg
│   ├── guacamole.jpg
│   └── tacos.jpg
└── packs
    └── application.js
```
> Isn't weird to put images and css in a folder called "javascript"? Depends. If you consider, from webpack's perspective, everything is a JavaScript module, it may not be so strange. Otherwise, it's possible to rename `app/javascript` or place your images elsewhere. More on that below.

### Images in JS

To reference an image from JavaScript in your Webpacker build, simply import it like any other module. React is not required for this to work ;)

```javascript
// app/javascripts/components/Taco.js
import TacoImage from '../images/tacos.jpg'

export default function({ title }) {
  return `
  <div>
    <h1>${title}</h1>
    <p><img src=${TacoImage} alt="Tacos, yum" /></p>
  </div>
  `
}
```
In the example above, webpack will import `TacoImage` as a url to the file. In other words, an "image module" in webpack exports a single default value, a string, representing the location of the file. Based on the default Webpacker configuration, the filename will look something like `"/packs/media/images/tacos-abcd1234.jpg"`.

Importing a image also works if you're using "CSS in JS" to style a React component.
```jsx
import React from 'react'

import TacoImage from '../images/tacos.jpg'

const styles = {
  backgroundImage: `url(${TacoImage})`,
}

export default function ({ title }) {
  return (
    <div style={styles}>
      {title}!
    </div>
  )
}
```

### Images in CSS

In Sprockets, when referencing images in CSS, you would use a special `image-url()` helper. In webpack, simply use the standard `url()` expression in CSS with a relative path.

```css
/* app/javascript/css/main.css */
.burritos {
  background-image: url("../images/burritos.jpg");
}
```
The output for the style rule will, again, look something like `background-image: url(/packs/media/images/burritos-efgh5678.jpg);`. This technique will also work for image paths in CSS Modules.

### Images in CSS within NPM modules

One tricky bit worth mentioning is bundling images referenced in SCSS within an imported NPM module. For example, many jQuery plugins bundle their own SCSS and image assets. When webpack processes this vendored CSS, you may see an error like the following, like in [this question on StackOverflow](https://stackoverflow.com/questions/58727976/import-images-of-an-npm-package-with-webpacker-and-rails):

```
Module not found: Error: Can't resolve '../img/controls.png'
```
The problem is the path does not resolve properly relative to the output for this vendored SCSS. From the [Webpacker docs](https://github.com/rails/webpacker/blob/76b491750993fada8b0b0cc2546dfcfbc4aaae13/docs/css.md#resolve-url-loader):

> Since Sass/libsass does not provide url rewriting, all linked assets must be relative to the output. Add the missing url rewriting using the resolve-url-loader. Place it directly after the sass-loader in the loader chain.

To fix this, you may need to get your hands dirty with some Webpacker configuration. Add the `resolve-url-loader` and configure in `config/webpack/environment.js`:

```shell
yarn add resolve-url-loader
```
```javascript
// config/webpack/environment.js
const { environment } = require('@rails/webpacker')

// resolve-url-loader must be used before sass-loader
environment.loaders.get('sass').use.splice(-1, 0, {
  loader: 'resolve-url-loader'
})
```
This loader rule, inserted in the loader pipeline for SASS/SCSS files, will ensure the proper url is written to the CSS output by webpack.

### Images in Rails views

You may be accustomed to `<%= lazy_image_tag 'tacos.jpg' %>` to reference a image bundled in the Rails asset pipeline. webpack has a similar tag:

```html
<!-- app/views/lunches/index.html.erb -->

<%= image_pack_tag 'media/images/guacamole.jpg' %>
```
Note, since Webpacker 4, the prefix `media/` is necessary and the remaining path represents the location from your webpack source path.

There's a catch. This change may result in the following error:

```
Webpacker::Manifest::MissingEntryError in Lunches#index
Showing /path/to/project/app/views/lunches/index.html.erb where line #4 raised:

Webpacker can't find media/images/guacamole.jpg in /path/to/project/public/packs/manifest.json.
```
However, if you use `<%= image_pack_tag 'media/images/tacos.jpg %>`, the taco image will happily renders. What gives?

Your Rails app is not being selective about cuisine. The difference is, we earlier imported the `tacos.jpg` image in webpack, but not `guacamole.jpg`.

One way to fix this issue is to import the `guacamole.jpg` image somewhere in your webpack dependency graph. It's not necessary to grab a reference to the imported variable because we only care about the side effect of emitting the file for Rails to reference in the view.

```js
import '../images/guacamole.jpg'
```

Another way to fix this issue is to import _all_ images in the `app/javascript/images` directory. webpack provides a special function to import many files in a directory in one expression: `require.context`. You might add this to your `application.js` pack:

```javascript
// app/javascript/packs/application.js

require.context('../images', true)
```
This expression will recursively require all the files in the `images` directory. As a result, we can now render `guacamole.jpg` in a Rails view.

> Note: I only recommend using `require.context` for your images if you need to render them in your Rails views; `require.context` is NOT necessary to import images into JS files like your React components, as illustrated earlier.

### Reconfiguring

If you don't feel comfortable with `app/javascript` as the source directory for `images`, you can either rename the source path or add to the set of resolved paths.

To rename `app/javascript`, rename the directory and tell Rails about it in `config/webpacker.yml`

```yaml
default: &default
  source_path: app/frontend
```
To add to the set of resolved paths where webpack should look for assets besides in `app/javascript`:
```yaml
default: &default
  additional_paths:
    - app/assets
```

### Diving Deeper

I have to admit, a few years ago, when I first heard about webpack, I was super-confused. I understood it to be a JavaScript module bundler. _How on Earth does it handle images?_

The short answer, of course, is _it depends_. Generally, webpack will treat everything it can understand as a JavaScript module. To help webpack understand images, projects would add a "loader" (or loaders) to the webpack configuration. A suitable loader would know how to handle an image file and output a representation of something, like an inlined base64 string, that can be manipulated in JavaScript.

To help webpack understand images, svg files, and fonts in your Rails project, Webpacker adds the `file-loader` package. This package will emit the imported file as a side effect of the build and return a path to the file as the module contents.

For more on how webpack works with images, check out the [asset management docs](https://webpack.js.org/guides/asset-management/#loading-images).

I also put together a sample Rails 6 Webpacker demo project on GitHub for more context:

* [Images in JS, CSS, and Rails](https://github.com/rossta/rails6-webpacker-demo/compare/example/images)
* [Images with CSS-in-JS in a React app](https://github.com/rossta/rails6-webpacker-demo/compare/example/react-image)
