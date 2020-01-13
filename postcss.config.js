const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./**/*.erb', './**/*.rb'],
  defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
  whitelist: ['blockquote', 'li', 'pre', 'code', 'figcaption'],
  whitelistPatterns: [/hljs/],
})

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    ...process.env.NODE_ENV === 'production'
      ? [purgecss]
      : []
  ]
}
