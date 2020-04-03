---
title: What's webpacker.yml for?
author: Ross Kaffenberger
published: false
summary: An unofficial Rails guide to Webpacker YAML configuration
description: Configuring webpacker can be a daunting task. In this guide, will take a look at the options provided via the webpacker.yml file, supported environment variables, as well as JavaScript-based configuration for webpack, Babel, and PostCSS.
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
  - Webpack
---

After reading this guide, you will know:

- what webpacker is and what it does
- how to organize your application assets
- how to manage Webpack behavior in webpacker.yml and JS config files
- how to configure Babel and PostCSS behavior

### What is webpacker

### Configuring webpacker

webpacker.yml options

##### source_path

The primary subdirectory within your Rails application where your webpack source code is located. Your [`source_entry_path`](#source_entry_path) directory should be located here. You can add to the list of source paths using [`resolved_paths`](#resolved_paths). Change this directory to something like `app/frontend` if you use webpack for non-JavaScript assets like CSS, images, fonts, etc.

```yaml
source_path: app/javascript
```

##### source_entry_path

The subdirectory within [`source_path`](#source_path) where your webpack entry point files are located. For example, given a `source_path` of `app/javascript`, a `source_entry_path` of `packs`, and an entry point named `application.js`, the path to this file from Rails root should be `app/javascript/packs/application.js`.

**!!!Warning!!!** Only use this directory for webpack entry points! [A common webpacker mistake](https://rossta.net/blog/overpacking-a-common-webpacker-mistake.html) is placing too many files in this directory.
```yaml
source_entry_path: packs
```

#### public_root_path

The primary destination within your Rail application where your compiled webpack assets are output. For most applications this should be `public`, i.e., corresponding to `Rails.public_path`. When [configuring webpacker for a Rails engine](https://github.com/rails/webpacker/blob/master/docs/engines.md), this value could be relative to the engine root, such as `../public`.
```yaml
public_root_path: public
```

##### public_output_path

The subdirectory destination within the [`public_output_path`](#public_output_path) where your compiled webpack assets are output. For example, given a `public_root_path` of `public` and a `public_output_path` of `packs`, the webpack manifest file, which maps canonical asset names to their fingerprinted output filenames, would be located at `public/packs/manifest.json` within your Rails application.

```yaml
public_output_path: packs
```

##### cache_path

The subdirectory where webpack, webpacker, babel, etc. will write cache files to enhance recompilation times. For example, given a `cache_path` of `tmp/cache/webpacker`, webpacker will write a SHA1 digest on each compilation of your source files in development to a file `tmp/cache/webpacker/last-compilation-digest-development`.

```yaml
cache_path: tmp/cache/webpacker
```

##### resolved_paths

This option expects an array of subdirectories where webpack should resolve modules. Given `resolved_paths` of `["app/assets/images"]`, webpack will lookup modules in your [`source_path`](#source_path), `node_modules`, and `app/assets/images`. When watching for file changes in development, webpack watched paths would include the `source_path` and `resolved_paths`.

```yaml
resolved_paths:
  - app/assets/images
```

##### webpack_compile_output

Set to `true` to print webpack output do STDOUT or `false` to silence. Unless you're extremely confident in what you're doing, the only correct value for this setting is `true`.
```yaml
webpack_compile_output: true
```

##### cache_manifest

The webpack `manifest.json` is one of the most important files in output webpacker asset compilation. It provides a mapping of canonical asset names to their fingerprinted filenames, e.g. `"application.js": "/packs/js/application-abcdefg12345.js"`. Rails uses the manifest to lookup the location of assets on disk. The `cache_manifest` setting simply tells Rails whether we want to maintain the parsed manifest in Ruby memory. Set this to `false` in `development` where you'll be making frequent changes to your source code; `true` in all other environments.

```yaml
cache_manifest: true
```

##### extract_css

Given a webpack bundle `application.js` that imports CSS, webpacker can be configured to emit the compiled CSS in one of two ways: 1) extracted as a separate file called `application.css` as you might expect from the Rails asset pipeline, or 2) as a JavaScript module that webpack will insert as CSS into the page dynamically when loaded in the browser. `extract_css: false` is helpful for development; most applications will want to set `extract_css: true` in production.

**Important** When using `extract_css: true`, you also need to use the `stylesheet_pack_tag` helper to loaded the extracted css, i.e, `<%= stylesheet_pack_tag "application" %>

```yaml
extract_css: true
```

##### static_assets_extensions

Provide a list of file extensions, such as `.jpeg`, `.png`, `.woff`, that webpack should emit as separate files, i.e, `import "../my-image.jpg"` will result in webpack emitting a file of that name instead of loading it in memory as a JavaScript module.

```yaml
static_file_extensions:
    - .jpg
    - .jpeg
    # ...
```

##### extensions

Provide a list of file extensions that webpack will recognize when searching for imported files to add to the dependency graph.

```yaml
extensions:
  - .js
  - .sass
  - .scss
  - .jsx
  - .vue
```

##### compile

Set this to `true` only when you want Rails to execute a shell command to compile webpack dynamically when attempting to serve a webpack asset or bundle. Set to `false` when webpack assets should be precompiled, as in `production` or when instead using the `webpack-dev-server` to handle webpack asset requests, as in `development`.

```yaml
compile: false
```

##### dev_server

Contains a set of key-value pairs that correspond to a subset of the `webpack-dev-server` configuration [outlined in the webpack docs](https://webpack.js.org/configuration/dev-server/). Rails only needs to know the `host`, `port`, `https` values to proxy requests to the `webpack-dev-server` in `development`. Other `dev_server` config values may be set in either `webpacker.yml` or in the webpack config exported from `config/webpack/development.js`.

```yaml
dev_server:
  https: false
  host: localhost
  port: 3035
  # ...
```

### Feedback

Did you find this guide useful? Please [share it]()

Just like with the official Rails guides, you're encouraged to help improve the quality of this one. [Please contribute](https://github.com/rossta/rossta.github.com/blob/develop/source/blog/2020-04-01-configuring-webpacker.html.md) if you see any typos or factual errors.
