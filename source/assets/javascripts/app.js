import '../stylesheets/app.css';

import 'enhance';
import debug from 'debug';

const log = debug('app:app');

import( /* webpackChunkName: "highlight" */ 'syntax-highlight')
  .then(({ default: highlight }) => highlight.initHighlighting())

import( /* webpackChunkName: "convertkit-form" */ '../stylesheets/convertkit-form.css')

if (__DEVELOPMENT__) {
  log('Running in development mode!');
}

if (__BUILD__) {
  log('Welcome to rossta.net!');
}
