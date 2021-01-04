---
title: Understanding webpacker.yml
author: Ross Kaffenberger
published: true
summary: An unofficial guide to Rails Webpacker YAML configuration
description: Configuring Webpacker can be a daunting task. In this guide, we will take a look at the options provided via the webpacker.yml file and supported environment variable overrides.
pull_image: 'blog/stock/adi-goldstein-mixer-unsplash.jpg'
pull_image_caption: Photo by Adi Goldstein on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
type: Guide
---
Though Webpacker adds a layer of "convention over configuration" in regards to webpack integration with Rails, the need for configuration remains. In this post, I'll describe the role of the `webpacker.yml` file for Webpacker configuration.

One of Webpacker's primary roles is helping Rails communicate with webpack.

Here are some things both Rails and webpack need to know:

> ​_Where are the source files located?_
>
> _What file types should be bundled?_
>
> _What's the destination for the bundle files?_
>
> _Should CSS be inserted dynamically via JavaScript or output as a separate file?_
>
> _What port should the webpack-dev-server listen on in development?_

That's where `webpacker.yml` comes in.

This file is read both Ruby code supplied by the Webpacker gem in the Rails server process and the JavaScript process that generates the webpack configuration via the `@rails/webpacker` NPM package. It supports a number of YAML entries which I'll describe in more detail in the [reference guide](#reference-guide).

> [Subscribe to my newsletter](https://little-fog-6985.ck.page/9c5bc129d8) to learn more about using webpack with Rails.

### Creating and updating

Webpacker expects to find this file at `config/webpacker.yml` within your Rails project. It is installed via the following command, provided by the Webpacker gem.
```sh
rails webpacker:install
```
The installer also generates environment-specific JavaScript files in `config/webpack/`.
```sh
config
│   ...
├── webpack
│   ├── development.js
│   ├── environment.js
│   ├── production.js
│   └── test.js
└── webpacker.yml
```
When upgrading the Webpacker gem, it's prudent to re-run the installer command to bring in new changes from the default `webpacker.yml` template. Differences will have to be merged intentionally to avoid losing project-specific customizations.

### Limitations

The `webpacker.yml` config file does not work with ERB as is typical with other Rails YAML config files, since the file must also be read in JavaScript. This may come as a surprise as indicated by recent issues, e.g. [#1615](https://github.com/rails/webpacker/issues/1615), [#956](https://github.com/rails/webpacker/issues/956).

One possible workaround is to use one of the supported [ENV var overrides](#env-var-overrides). It may also be an option to manipulate the JavaScript config in one of the `config/webpack` JavaScript files—look for a future post on the subject.

### Reference guide

Following is reference guide for supported Webpacker configuration options as of Webpacker version `>= 4`.

#### source_path

The primary subdirectory within your Rails application where your webpack source code is located. Your [`source_entry_path`](#source_entry_path) directory should be located here. You can add to the list of source paths using [`additional_paths`](#additional_paths). Change this directory to something like `app/frontend` if you use webpack for non-JavaScript assets like CSS, images, fonts, etc.

```yaml
source_path: app/javascript
```

#### source_entry_path

The subdirectory within [`source_path`](#source_path) where your webpack entry point files are located. For example, given a `source_path` of `app/javascript`, a `source_entry_path` of `packs`, and an entry point named `application.js`, the path to this file from Rails root should be `app/javascript/packs/application.js`.

```yaml
source_entry_path: packs
```
**!!!Warning!!!** Only use this directory for webpack entry points! [A common webpacker mistake](https://rossta.net/blog/overpacking-a-common-webpacker-mistake.html) is placing too many files in this directory.

#### additional_paths

This option expects an array of subdirectories where webpack should resolve modules. Given `additional_paths` of `["app/assets/images"]`, webpack will lookup modules in your [`source_path`](#source_path), `node_modules`, and `app/assets/images`. When watching for file changes in development, webpack watched paths would include the `source_path` and `additional_paths`. The `additional_paths` key replaces the `resolved_paths` key in earlier versions of Webpacker, so this is a key you'll want to rename when upgrading to Webpacker 5+.

```yaml
additional_paths:
  - app/assets/images
```

#### public_root_path

The primary destination within your Rail application where your compiled webpack assets are output. For most applications this should be `public`, i.e., corresponding to `Rails.public_path`. When [configuring webpacker for a Rails engine](https://github.com/rails/webpacker/blob/master/docs/engines.md), this value could be relative to the engine root, such as `../public`.
```yaml
public_root_path: public
```

#### public_output_path

The subdirectory destination within the [`public_output_path`](#public_output_path) where your compiled webpack assets are output. For example, given a `public_root_path` of `public` and a `public_output_path` of `packs`, the webpack manifest file, which maps canonical asset names to their fingerprinted output filenames, would be located at `public/packs/manifest.json` within your Rails application.

```yaml
public_output_path: packs
```

#### cache_path

The subdirectory where webpack, webpacker, babel, etc. will write cache files to enhance recompilation times. For example, given a `cache_path` of `tmp/cache/webpacker`, webpacker will write a SHA1 digest on each compilation of your source files in development to a file `tmp/cache/webpacker/last-compilation-digest-development`.

```yaml
cache_path: tmp/cache/webpacker
```

#### webpack_compile_output

Set to `true` to print webpack output do STDOUT or `false` to silence. Unless you're extremely confident in what you're doing, the only correct value for this setting is `true`.
```yaml
webpack_compile_output: true
```

#### cache_manifest

The webpack `manifest.json` is one of the crucial files in output webpacker asset compilation. It provides a mapping of canonical asset names to their fingerprinted filenames, e.g. `"application.js": "/packs/js/application-abcdefg12345.js"`. Rails uses the manifest to lookup the location of assets on disk. The `cache_manifest` setting simply tells Rails whether we want to maintain the parsed manifest in Ruby memory. Set this to `false` in `development` where you'll be making frequent changes to your source code; `true` in all other environments.

```yaml
cache_manifest: true
```

#### extract_css

Given a webpack bundle `application.js` that imports CSS, webpacker can be configured to emit the compiled CSS in one of two ways: 1) extracted as a separate file called `application.css` as you might expect from the Rails asset pipeline, or 2) as a JavaScript module that webpack will insert as CSS into the page dynamically when loaded in the browser. `extract_css: false` is helpful for development; most applications will want to set `extract_css: true` in production.

```yaml
extract_css: true
```
**Important** With `extract_css: true`, you must use `stylesheet_pack_tag`, i.e, `<%= stylesheet_pack_tag "application" %>`, in your Rails view. This can be easy to miss in deployed environments after using `extract_css: false` for local development.

#### static_assets_extensions

Provide a list of file extensions, such as `.jpeg`, `.png`, `.woff`, that webpack should emit as separate files, i.e, `import "../my-image.jpg"` will result in webpack emitting a file of that name instead of loading it in memory as a JavaScript module.

```yaml
static_file_extensions:
    - .jpg
    - .jpeg
    # ...
```

#### extensions

Provide a list of file extensions that webpack will recognize when searching for imported files to add to the dependency graph.

```yaml
extensions:
  - .js
  - .sass
  - .scss
  - .jsx
  - .vue
```

#### compile

Set this to `true` only when you want Rails to execute a shell command to compile webpack dynamically when attempting to serve a webpack asset or bundle. Set to `false` when webpack assets should be precompiled, as in `production` or when instead using the `webpack-dev-server` to handle webpack asset requests, as in `development`.

```yaml
compile: false
```

#### dev_server

This config contains a set of key-value pairs that correspond to a subset of the `webpack-dev-server` configuration [outlined in the webpack docs](https://webpack.js.org/configuration/dev-server/).

Rails only needs to know the `host`, `port`, `https` values to proxy requests to the `webpack-dev-server` in `development`. Other `dev_server` config values may be set in either `webpacker.yml` or in the webpack config exported from `config/webpack/development.js`. Make sure at least the following values are set in `webpacker.yml`:
```yaml
development:
  # ...
  dev_server:
    https: false
    host: localhost
    port: 3035
    public: localhost:3035
    # ..
```
To enable auto-recompile when source files are changed:
```yaml
development:
  # ...
  dev_server:
    # ...
    inline: true
    # ...
```
To enable [hot-module replacement](https://webpack.js.org/concepts/hot-module-replacement/):
```yaml
development:
  # ...
  extract_css: false # to allow HMR for CSS

  dev_server:
    # ...
    inline: true
    hmr: true
    # ...
```
Refer to the [Webpacker docs](https://github.com/rails/webpacker/blob/master/docs/webpack-dev-server.md) and [webpack docs](https://webpack.js.org/configuration/dev-server/) for more info.

### ENV var overrides

Some Rails configuration can be overriden via ENV vars. This is especially helpful to workaround certain [limitations](#limitations). Many of the `dev_server` options can be specified in upcase with the prefix `WEBPACKER_DEV_SERVER_`, as illustrated below:
```sh
WEBPACKER_DEV_SERVER_HOST=localhost \
WEBPACKER_DEV_SERVER_PORT=8765 \
WEBPACKER_DEV_SERVER_PUBLIC=localhost:8765 \
./bin/webpack-dev-server
```
Other supported Webpacker ENV vars include:
```sh
WEBPACKER_NODE_MODULES_BIN_PATH
WEBPACKER_RELATIVE_URL_ROOT
WEBPACKER_ASSET_HOST
```

### Feedback

Did you find this guide useful? Please [share it](https://twitter.com/intent/tweet?text=How+to+use+webpacker.yml%3A+An+unofficial+guide+to+Rails+Webpacker+YAML+configuration&url=https%3A%2F%2Frossta.net%2Fblog%2Fhow-to-use-webpacker-yml.html).

Just like with the official Rails guides, you're encouraged to help improve the quality of this one. [Please contribute](https://github.com/rossta/rossta.github.com/blob/develop/source/blog/2020-04-01-configuring-webpacker.html.md) if you see any typos or factual errors.
