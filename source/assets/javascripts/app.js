import '../stylesheets/app.scss';
import 'enhance';
import debug from 'debug';

const log = debug('app:app');

import(/* webpackChunkName: "highlight.js", webpackPrefetch: true */ 'highlight.js').then(hljs => hljs.initHighlightingOnLoad());

if (__DEVELOPMENT__) {
  log('Running in development mode!');
}

if (__BUILD__) {
  log('Welcome to rossta.net!');
}
