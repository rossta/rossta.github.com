require('foundation-sites/js/vendor/modernizr');
require('foundation-sites/js/foundation');
require('foundation-sites/js/foundation/foundation.topbar');
require('foundation-sites/js/vendor/jquery.cookie');

import hljs from 'highlight.js';
import 'zen';
import 'tracking';

hljs.initHighlightingOnLoad();
$(document).foundation();

$(function() {
  $.zen(function(toBe) { $('#zen').find('.enlightenment').text(toBe); });
});
