// import 'foundation/js/vendor/jquery.cookie';
import $ from 'jquery';
import hljs from 'highlight.js';
import 'zen';
import 'tracking';

require("foundation-sites/js/foundation");
require("foundation-sites/js/foundation/foundation.topbar");

hljs.initHighlightingOnLoad();
$(document).foundation();

$(function() {
  $.zen(function(toBe) { $('#zen').find('.enlightenment').text(toBe); });
});

//= require foundation/js/vendor/jquery
//= require foundation/js/vendor/jquery.cookie
//= require foundation
//= require foundation/js/foundation/foundation.topbar
