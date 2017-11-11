import $ from 'jquery';
import hljs from 'highlight.js';
import 'tracking';
import 'zen';
import 'enhance';
import debug from 'debug';

const log = debug('app:app');

hljs.initHighlightingOnLoad();

$(() => {
  $.zen((toBe) => { $('#zen').find('.enlightenment').text(toBe); });

  $('.top-bar').on('click', '.menu-icon a', (e) => {
    e.preventDefault();
    $(e.delegateTarget).toggleClass('expanded');
  });
});

if (__DEVELOPMENT__) {
  log('Running in development mode!');
}

if (__BUILD__) {
  log('Welcome to rossta.net!');
}
