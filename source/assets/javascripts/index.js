import hljs from 'highlight.js';
import 'tracking';
import 'zen';
import 'enhance';

hljs.initHighlightingOnLoad();

$(function() {
  $.zen(function(toBe) { $('#zen').find('.enlightenment').text(toBe); });

  $('.top-bar').on('click', '.menu-icon a', function(e) {
    e.preventDefault();
    $(e.delegateTarget).toggleClass('expanded');
  });
});

if (__DEVELOPMENT__) {
  console.log("Running in development mode!");
}

if (__PRODUCTION__) {
  console.log("Welcome to rossta.net!", __PRODUCTION__, __DEVELOPMENT__);
}
