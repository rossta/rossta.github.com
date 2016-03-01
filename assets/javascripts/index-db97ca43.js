import hljs from 'highlight.js';
import 'tracking';
import 'zen';

hljs.initHighlightingOnLoad();

$(function() {
  $.zen(function(toBe) { $('#zen').find('.enlightenment').text(toBe); });

  $('.top-bar').on('click', '.menu-icon a', function(e) {
    e.preventDefault();
    $(e.delegateTarget).toggleClass('expanded');
  });
});
