const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {sitePlugins, swPlugins} = require('./config/plugins');

const babelLoader = {
  test: /.*\.js$/,
  exclude: /(node_modules|\.tmp|vendor)/,
  loader: "babel-loader",
};

const siteConfig = {
  entry: {
    app: [
      './source/assets/stylesheets/app.scss',
      './source/assets/javascripts/app.js'
    ],
    vendor: [
      'babel-polyfill',
      'jquery',
      'foundation-sites/js/vendor/modernizr',
      'highlight.js'
    ],
  },

  resolve: {
    modules: [
      path.join(__dirname, "source", "assets", "javascripts"),
      "node_modules"
    ]
  },

  output: {
    path: __dirname + '/.tmp/dist',
    filename: 'assets/javascripts/[name].bundle.js',
  },

  module: {
    rules: [
      babelLoader,

      {
        test: require.resolve("jquery"),
        use: [{
          loader: "expose-loader",
          options: "$"
        }]
      },

      {
        test: /[\\\/]vendor[\\\/]modernizr\.js$/,
        use: [
          "imports-loader?this=>window",
          "exports-loader?Modernizr"
        ]
      },

      {
        test: /(\.css|\.scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                sourceMap: true
              }
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
                includePaths: [
                  path.resolve(__dirname, "node_modules/foundation-sites"),
                  path.resolve(__dirname, "node_modules/highlight.js/styles"),
                ]
              }
            }
          ]
        })
      },
    ],
  },

  node: {
    console: true
  },

  plugins: sitePlugins,
};

const swConfig = {
  entry: {
    serviceworker: "./source/assets/javascripts/serviceworker.js",
  },

  resolve: {
    modules: [
      path.join(__dirname, "source", "assets", "javascripts"),
      "node_modules"
    ]
  },

  output: {
    path: __dirname + "/.tmp/dist",
    filename: "serviceworker.js",
  },

  module: {
    rules: [
      babelLoader,
    ],
  },

  node: {
    console: true
  },

  plugins: swPlugins,
}

module.exports = [ siteConfig, swConfig ];
