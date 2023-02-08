import highlight from 'highlight.js/lib/core'

import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import elixir from 'highlight.js/lib/languages/elixir'
import erb from 'highlight.js/lib/languages/erb'
import xml from 'highlight.js/lib/languages/xml'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import nginx from 'highlight.js/lib/languages/nginx'
import ruby from 'highlight.js/lib/languages/ruby'
import shell from 'highlight.js/lib/languages/shell'
import yaml from 'highlight.js/lib/languages/yaml'

const languages = {
  bash,
  css,
  scss,
  erb,
  elixir,
  xml,
  javascript,
  json,
  nginx,
  ruby,
  shell,
  yaml,
}

Object.entries(languages).forEach(([name, language]) => {
  highlight.registerLanguage(name, language)
})

export default highlight
