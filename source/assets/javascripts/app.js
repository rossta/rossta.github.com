import '../stylesheets/app.scss';
import 'enhance';
import 'syntax-highlight';
import debug from 'debug';

const log = debug('app:app');

if (__DEVELOPMENT__) {
  log('Running in development mode!');
}

if (__BUILD__) {
  log('Welcome to rossta.net!');
}
