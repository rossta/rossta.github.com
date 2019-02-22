import highlight from 'highlight.js/lib/highlight';

import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import elixir from 'highlight.js/lib/languages/elixir';
import html from 'highlight.js/lib/languages/html';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import ruby from 'highlight.js/lib/languages/ruby';
import shell from 'highlight.js/lib/languages/shell';
import yaml from 'highlight.js/lib/languages/yaml';

const languages = {
  bash,
  css,
  elixir,
  html,
  javascript,
  json,
  nginx,
  ruby,
  shell,
  yaml,
};

Object.entries(languages).forEach(([name, language]) => {
  highlight.registerLanguage(name, language);
});

highlight.initHighlightingOnLoad();
