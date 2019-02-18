import '../stylesheets/app.scss';
import hljs from 'highlight.js';
import 'enhance';
import debug from 'debug';

const log = debug('app:app');

hljs.initHighlightingOnLoad();

if (__DEVELOPMENT__) {
  log('Running in development mode!');
}

if (__BUILD__) {
  log('Welcome to rossta.net!');
}
