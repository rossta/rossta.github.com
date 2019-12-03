const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    purgecss({
      content: ['./**/*.erb', './**/*.rb'],
      defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
      whitelist: ['blockquote', 'li'],
      whitelistPatterns: [/hljs/],
    }),
  ]
}
