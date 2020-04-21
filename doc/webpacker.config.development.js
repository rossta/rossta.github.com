ConfigObject {
  mode: 'development',
  output: {
    filename: 'js/[name]-[contenthash].js',
    chunkFilename: 'js/[name]-[contenthash].chunk.js',
    hotUpdateChunkFilename: 'js/[id]-[hash].hot-update.js',
    path: '/path/to/rails/app/public/packs',
    publicPath: '/packs/',
    pathinfo: true
  },
  resolve: {
    extensions: [
      '.mjs',         '.js',
      '.sass',        '.scss',
      '.css',         '.module.sass',
      '.module.scss', '.module.css',
      '.png',         '.svg',
      '.gif',         '.jpeg',
      '.jpg'
    ],
    plugins: [
      {
        apply: [Function: nothing],
        makePlugin: [Function],
        moduleLoader: [Function],
        topLevelLoader: { apply: [Function: nothing] },
        bind: [Function],
        tsLoaderOptions: [Function],
        forkTsCheckerOptions: [Function]
      }
    ],
    modules: [
      '/path/to/rails/app/app/javascript',
      'node_modules'
    ]
  },
  resolveLoader: {
    modules: [ 'node_modules' ],
    plugins: [ { apply: [Function: nothing] } ]
  },
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  cache: true,
  devtool: 'cheap-module-source-map',
  devServer: {
    clientLogLevel: 'none',
    compress: true,
    quiet: false,
    disableHostCheck: true,
    host: 'localhost',
    port: 3035,
    https: false,
    hot: false,
    contentBase: '/path/to/rails/app/public/packs',
    inline: true,
    useLocalIp: false,
    public: 'localhost:3035',
    publicPath: '/packs/',
    historyApiFallback: { disableDotRule: true },
    headers: { 'Access-Control-Allow-Origin': '*' },
    overlay: true,
    stats: {
      entrypoints: false,
      errorDetails: true,
      modules: false,
      moduleTrace: false
    },
    watchOptions: { ignored: '**/node_modules/**' }
  },
  entry: {
    application: '/path/to/rails/app/app/javascript/packs/application.js'
  },
  module: {
    strictExportPresence: true,
    rules: [
      { parser: { requireEnsure: false } },
      {
        test: /(.jpg|.jpeg|.png|.gif|.tiff|.ico|.svg|.eot|.otf|.ttf|.woff|.woff2)$/i,
        use: [
          {
            loader: 'file-loader',
            options: { name: [Function: name], context: 'app/javascript' }
          }
        ]
      },
      {
        test: /\.(css)$/i,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: { sourceMap: true, importLoaders: 2, modules: false }
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: '/path/to/rails/app'
              },
              sourceMap: true
            }
          }
        ],
        sideEffects: true,
        exclude: /\.module\.[a-z]+$/
      },
      {
        test: /\.(scss|sass)(\.erb)?$/i,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: { sourceMap: true, importLoaders: 2, modules: false }
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: '/path/to/rails/app'
              },
              sourceMap: true
            }
          },
          { loader: 'sass-loader', options: { sourceMap: true } }
        ],
        sideEffects: true,
        exclude: /\.module\.[a-z]+$/
      },
      {
        test: /\.(css)$/i,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2,
              modules: { localIdentName: '[name]__[local]___[hash:base64:5]' }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: '/path/to/rails/app'
              },
              sourceMap: true
            }
          }
        ],
        sideEffects: false,
        include: /\.module\.[a-z]+$/
      },
      {
        test: /\.(scss|sass)$/i,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2,
              modules: { localIdentName: '[name]__[local]___[hash:base64:5]' }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: '/path/to/rails/app'
              },
              sourceMap: true
            }
          },
          { loader: 'sass-loader', options: { sourceMap: true } }
        ],
        sideEffects: false,
        include: /\.module\.[a-z]+$/
      },
      {
        test: /\.(js|mjs)$/,
        include: /node_modules/,
        exclude: /(?:@?babel(?:\/|\\{1,2}|-).+)|regenerator-runtime|core-js|^webpack$|^webpack-assets-manifest$|^webpack-cli$|^webpack-sources$|^@rails\/webpacker$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [ [ '@babel/preset-env', { modules: false } ] ],
              cacheDirectory: 'tmp/cache/webpacker/babel-loader-node-modules',
              cacheCompression: false,
              compact: false,
              sourceMaps: false
            }
          }
        ]
      },
      {
        test: /\.(js|jsx|mjs)?(\.erb)?$/,
        include: [
          '/path/to/rails/app/app/javascript'
        ],
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: 'tmp/cache/webpacker/babel-loader-node-modules',
              cacheCompression: false,
              compact: false
            }
          }
        ]
      }
    ]
  },
  plugins: [
    EnvironmentPlugin {
      keys: [
        /* your ENV keys */
      ],
      defaultValues: {
        /* your ENV key,value pairs */
      }
    },
    CaseSensitivePathsPlugin {
      options: {},
      pathCache: {},
      fsOperations: 0,
      primed: false
    },
    MiniCssExtractPlugin {
      options: {
        filename: 'css/[name]-[contenthash:8].css',
        moduleFilename: [Function: moduleFilename],
        ignoreOrder: false,
        chunkFilename: 'css/[name]-[contenthash:8].chunk.css'
      }
    },
    WebpackAssetsManifest {
      hooks: {
        apply: SyncHook {
          _args: [ 'manifest' ],
          taps: [],
          interceptors: [],
          call: [Function: lazyCompileHook],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: undefined
        },
        customize: SyncWaterfallHook {
          _args: [ 'entry', 'original', 'manifest', 'asset' ],
          taps: [],
          interceptors: [],
          call: [Function: lazyCompileHook],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: undefined
        },
        transform: SyncWaterfallHook {
          _args: [ 'assets', 'manifest' ],
          taps: [
            {
              type: 'sync',
              fn: [Function],
              name: 'WebpackAssetsManifest'
            }
          ],
          interceptors: [],
          call: [Function: anonymous],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: [ [Function] ]
        },
        done: SyncHook {
          _args: [ 'manifest', 'stats' ],
          taps: [],
          interceptors: [],
          call: [Function: lazyCompileHook],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: undefined
        },
        options: SyncWaterfallHook {
          _args: [ 'options' ],
          taps: [],
          interceptors: [],
          call: [Function: lazyCompileHook],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: undefined
        },
        afterOptions: SyncHook {
          _args: [ 'options' ],
          taps: [
            {
              type: 'sync',
              fn: [Function],
              name: 'WebpackAssetsManifest'
            }
          ],
          interceptors: [],
          call: [Function: lazyCompileHook],
          promise: [Function: lazyCompileHook],
          callAsync: [Function: lazyCompileHook],
          _x: undefined
        }
      },
      options: {
        assets: [Object: null prototype] {},
        output: 'manifest.json',
        replacer: null,
        space: 2,
        writeToDisk: true,
        fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
        sortManifest: true,
        merge: false,
        publicPath: '/packs/',
        apply: null,
        customize: null,
        transform: null,
        done: null,
        entrypoints: true,
        entrypointsKey: 'entrypoints',
        integrity: false,
        integrityHashes: [ 'sha256', 'sha384', 'sha512' ],
        integrityPropertyName: 'integrity'
      },
      assets: [Object: null prototype] {},
      assetNames: Map {},
      currentAsset: null,
      compiler: null,
      stats: null,
      hmrRegex: null,
      [Symbol(isMerging)]: false
    }
  ]
}
