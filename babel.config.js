const DEFAULT_SCOPE_NAME = '[path]___[name]__[local]___[hash:base64:5]'

module.exports = function(api) {
  var validEnv = ['development', 'production']
  var currentEnv = api.env()
  var isDevelopmentEnv = api.env('development')
  var isProductionEnv = api.env('production')
  var isTestEnv = api.env('test')

  if (!validEnv.includes(currentEnv)) {
    throw new Error(
      'Please specify a valid `NODE_ENV` or ' +
        '`BABEL_ENV` environment variables. Valid values are "development", ' +
        '"test", and "production". Instead, received: ' +
        JSON.stringify(currentEnv) +
        '.',
    )
  }

  return {
    presets: [
      isTestEnv && [
        require('@babel/preset-env').default,
        {
          targets: {
            node: 'current',
          },
        },
      ],
      (isProductionEnv || isDevelopmentEnv) && [
        require('@babel/preset-env').default,
        {
          forceAllTransforms: true,
          useBuiltIns: 'entry',
          modules: false,
          exclude: ['transform-typeof-symbol'],
          corejs: 2,
        },
      ],
    ].filter(Boolean),
    plugins: [
      require('@babel/plugin-syntax-dynamic-import').default,
      [
        require('babel-plugin-module-resolver'),
        {
          root: ['./source/assets/javascripts'],
          alias: {},
        },
      ],
    ].filter(Boolean),
  }
}
