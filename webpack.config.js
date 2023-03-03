const path = require('path')

const { sitePlugins, styleLoader } = require('./config/plugins')
const env = require('./config/env')

module.exports = {
  mode: env.__DEVELOPMENT__ ? 'development' : 'production',

  entry: {
    app: './source/assets/javascripts/app.js',
  },

  devtool: env.__DEVELOPMENT__
    ? 'cheap-module-source-map'
    : 'source-map',

  resolve: {
    modules: [
      path.join(__dirname, 'source', 'assets', 'javascripts'),
      'node_modules',
    ],
  },

  output: {
    path: `${__dirname}/.tmp/dist`,
    publicPath: '/',
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
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
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

  plugins: sitePlugins,
}
