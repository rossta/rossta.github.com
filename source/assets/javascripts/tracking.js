(function($) {
  var Tracking = function() {
    this.traits = {};
    this.events = {};
  }

  Tracking.prototype.identify = function (props) {
    this.traits = $.extend(this.traits, {}, props);
    return this.traits;
  };

  Tracking.prototype.track = function(name, props) {
    this.events[name] = $.extend(this.events[name], {}, props);
    return this.events[name];
  };

  $.extend({
    tracking: new Tracking()
  });

  return Tracking;
})(jQuery);
