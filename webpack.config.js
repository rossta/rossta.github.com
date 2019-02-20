const path = require('path');

const { sitePlugins, styleLoader } = require('./config/plugins');

module.exports = {
  entry: {
    app: './source/assets/javascripts/app.js',
  },

  resolve: {
    modules: [path.join(__dirname, 'source', 'assets', 'javascripts'), 'node_modules'],
  },

  output: {
    path: `${__dirname}/.tmp/dist/assets`,
    publicPath: '/assets/',
    filename: 'js/[name].[contenthash].js',
    chunkFilename: 'js/[name].chunk.[contenthash].js',
  },

  module: {
    rules: [
      {
        test: /.*\.js$/,
        exclude: /(node_modules|\.tmp|vendor)/,
        loader: 'babel-loader',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          styleLoader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              includePaths: [
                path.resolve(__dirname, 'node_modules/foundation-sites'),
                path.resolve(__dirname, 'node_modules/highlight.js/styles'),
              ],
            },
          },
        ],
      },
    ],
  },

  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
    },
  },

  node: {
    console: true,
  },

  plugins: sitePlugins,
};
