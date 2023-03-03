const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const WebpackAssetsManifest = require('webpack-assets-manifest')

const env = require('./env')

const definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(env.__DEVELOPMENT__),
  __BUILD__: JSON.stringify(env.__BUILD__),
  __VERSION__: JSON.stringify(env.__VERSION__),
})

const cleanPluginTmp = new CleanWebpackPlugin()

const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: 'css/[name].[contenthash].css',
  chunkFilename: 'css/[name].chunk.[contenthash].css',
})

const manifestPlugin = new WebpackAssetsManifest({
  entrypoints: true,
  writeToDisk: true,
  output: 'manifest.json',
  entrypointsUseAssets: true,
  publicPath: true,
})

let sitePlugins = [
  definePlugin,
  cleanPluginTmp,
  miniCssExtractPlugin,
  manifestPlugin,
]

if (env.__BUILD__) {
  const compressionPluginGzip = new CompressionPlugin({
    filename: '[path].gz[query]',
    algorithm: 'gzip',
    test: /\.(js|css|html|json|ico|svg|eot|otf|ttf)$/,
  })

  const hashedModuleIdsPlugin = new webpack.HashedModuleIdsPlugin()

  sitePlugins = [
    ...sitePlugins,
    compressionPluginGzip,
    hashedModuleIdsPlugin,
  ]
}

if (process.env.WEBPACK_ANALYZE_BUNDLE) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
  const bundleAnalyzerPlugin = new BundleAnalyzerPlugin()

  sitePlugins = [...sitePlugins, bundleAnalyzerPlugin]
}

const styleLoader = MiniCssExtractPlugin.loader

module.exports = {
  sitePlugins,
  styleLoader,
}
