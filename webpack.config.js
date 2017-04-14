var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var Clean = require('clean-webpack-plugin');
var path = require('path');

var definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(JSON.parse(process.env.WEBPACK_ENV === 'development')),
  __DEBUG__:       JSON.stringify(JSON.parse(process.env.WEBPACK_ENV === 'debug')),
  __BUILD__:       JSON.stringify(JSON.parse(process.env.WEBPACK_ENV === 'build')),
  __VERSION__:     (new Date().getTime().toString())
});

var siteConfig = {
  entry: {
    index: [
      './source/assets/stylesheets/index.scss',
      './source/assets/javascripts/index.js'
    ],
    head: './source/assets/javascripts/head.js',
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
      {
        test: /source\/assets\/javascripts\/.*\.js$/,
        exclude: /(node_modules|\.tmp|vendor)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'es2015', 'stage-0'],
          }
        },
      },

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

  plugins: [
    definePlugin,
    new Clean([".tmp"]),
    new ExtractTextPlugin("assets/stylesheets/index.bundle.css"),
    new webpack.optimize.CommonsChunkPlugin({name: "head", filename: "assets/javascripts/head.bundle.js"}),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
  ],
};

var swConfig = {
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
      {
        test: /source\/assets\/javascripts\/.*\.js$/,
        exclude: /(node_modules|\.tmp|vendor)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env", "es2015", "stage-0"],
            // plugins: [require("babel-plugin-transform-object-rest-spread")]
          }
        },
      },
    ],
  },

  node: {
    console: true
  },

  plugins: [definePlugin],
}

module.exports = [ siteConfig, swConfig ];
