const webpack = require('webpack');
const env = require('./env');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const Clean = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const definePlugin = new webpack.DefinePlugin({
  __DEVELOPMENT__: JSON.stringify(env.__DEVELOPMENT__),
  __BUILD__: JSON.stringify(env.__BUILD__),
  __VERSION__: JSON.stringify(env.__VERSION__),
});

const cleanPluginTmp = new Clean(['.tmp']);

const extractPluginCSS = new ExtractTextPlugin('assets/stylesheets/[name].css');

const commonsChunkPlugin = new webpack.optimize.CommonsChunkPlugin({
  names: ['vendor', 'runtime'],
});

const providePluginJquery = new webpack.ProvidePlugin({
  $: 'jquery',
  jQuery: 'jquery',
  'window.jQuery': 'jquery',
});

let sitePlugins = [
  definePlugin,
  cleanPluginTmp,
  extractPluginCSS,
  commonsChunkPlugin,
  providePluginJquery,
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

const swPlugins = [definePlugin];

module.exports = {
  sitePlugins,
  swPlugins,
};
