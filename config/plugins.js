const webpack = require('webpack');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const  { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

const env = require('./env');

const definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(env.__DEVELOPMENT__),
  __BUILD__: JSON.stringify(env.__BUILD__),
  __VERSION__: JSON.stringify(env.__VERSION__),
});

const cleanPluginTmp = new CleanWebpackPlugin();

const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: 'css/[name].[contenthash].css',
  chunkFilename: 'css/[name].chunk.[contenthash].css',
});

const manifestPlugin = new ManifestPlugin({
  writeToFileEmit: true,
});

let sitePlugins = [
  definePlugin,
  cleanPluginTmp,
  miniCssExtractPlugin,
  manifestPlugin,
];

if (env.__BUILD__) {
  const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
    compress: {
      warnings: false,
    },
    output: {
      comments: false,
    },
  });

  const compressionPluginGzip = new CompressionPlugin({
    asset: '[path].gz[query]',
    algorithm: 'gzip',
    test: /\.(js|css|html|json|ico|svg|eot|otf|ttf)$/,
  });

  const hasheModuleIdsPlugin = new webpack.HashedModuleIdsPlugin();

  sitePlugins = [...sitePlugins, uglifyJsPlugin, compressionPluginGzip, hasheModuleIdsPlugin];
}

if (process.env.WEBPACK_ANALYZE_BUNDLE) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  const bundleAnalyzerPlugin = new BundleAnalyzerPlugin();

  sitePlugins = [...sitePlugins, bundleAnalyzerPlugin];
}

const styleLoader = MiniCssExtractPlugin.loader;

module.exports = {
  sitePlugins,
  styleLoader,
};
