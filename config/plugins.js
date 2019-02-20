const webpack = require('webpack');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Clean = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const env = require('./env');

const definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(env.__DEVELOPMENT__),
  __BUILD__: JSON.stringify(env.__BUILD__),
  __VERSION__: JSON.stringify(env.__VERSION__),
});

const cleanPluginTmp = new Clean(['.tmp']);

const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: '[name].css',
  chunkFilename: '[id].css',
});

let sitePlugins = [
  definePlugin,
  cleanPluginTmp,
  miniCssExtractPlugin,
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

  sitePlugins = [...sitePlugins, uglifyJsPlugin, compressionPluginGzip];
}

// const styleLoader = env.__DEVELOPMENT__ ? 'style-loader' : MiniCssExtractPlugin.loader;
const styleLoader = MiniCssExtractPlugin.loader;

module.exports = {
  sitePlugins,
  styleLoader,
};
