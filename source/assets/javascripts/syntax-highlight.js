import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import ruby from 'highlight.js/lib/languages/ruby';
import elixir from 'highlight.js/lib/languages/elixir';
import shell from 'highlight.js/lib/languages/shell';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import nginx from 'highlight.js/lib/languages/nginx';
import json from 'highlight.js/lib/languages/json';

const languages = {
  javascript,
  ruby,
  elixir,
  shell,
  bash,
  css,
  nginx,
  json,
};

Object.entries(languages).forEach(([name, language]) => {
  hljs.registerLanguage(name, language);
});

hljs.initHighlightingOnLoad();
