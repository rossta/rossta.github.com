var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: {
    index: './source/assets/javascripts/index.js',
    application: './source/assets/stylesheets/application.scss'
  },
  resolve: {
    root: __dirname + '/source/javascripts',
  },

  output: {
    path: __dirname + '/tmp/dist',
    filename: 'javascripts/[name].js',
  },
  module: {
    loaders: [{
      test: /source\/javascripts\/.*\.js$/,
      exclude: /node_modules|\.tmp|vendor/,
      loaders: ['babel'],
      query: {
        cacheDirectory: true,
        presets: ['es2015', 'react']
      }
    }, {
      test: /\.scss/,
      loader: ExtractTextPlugin.extract("style-loader", "css-loader")
    }]
  },
  plugins: [
    new ExtractTextPlugin("application.css")
  ]
};
