//= require foundation/js/vendor/jquery
//= require foundation/js/vendor/jquery.cookie
//= require foundation
// require foundation/js/foundation/foundation.abide
// require foundation/js/foundation/foundation.accordion
// require foundation/js/foundation/foundation.alert
// require foundation/js/foundation/foundation.clearing
// require foundation/js/foundation/foundation.dropdown
// require foundation/js/foundation/foundation.interchange
// require foundation/js/foundation/foundation.joyride
// require foundation/js/foundation/foundation.magellan
// require foundation/js/foundation/foundation.offcanvas
// require foundation/js/foundation/foundation.orbit
// require foundation/js/foundation/foundation.reveal
// require foundation/js/foundation/foundation.tab
// require foundation/js/foundation/foundation.tooltip
//= require foundation/js/foundation/foundation.topbar
//= require highlightjs/highlight.pack

//= require zen

hljs.initHighlightingOnLoad();
$(document).foundation();

$(function() {
   $.zen(function(toBe) { $('#zen').find('.enlightenment').text(toBe); });
});
