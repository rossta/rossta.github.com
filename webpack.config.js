const path = require('path')

const { sitePlugins, styleLoader } = require('./config/plugins')
const env = require('./config/env')

const TerserPlugin = require('terser-webpack-plugin')

const minimizer = env.__BUILD__
  ? [
      new TerserPlugin({
        parallel: true,
        cache: true,
        sourceMap: true,
      }),
    ]
  : undefined

module.exports = {
  entry: {
    app: './source/assets/javascripts/app.js',
  },

  resolve: {
    modules: [path.join(__dirname, 'source', 'assets', 'javascripts'), 'node_modules'],
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
    minimizer,
  },

  node: {
    console: true,
  },

  plugins: sitePlugins,
}
