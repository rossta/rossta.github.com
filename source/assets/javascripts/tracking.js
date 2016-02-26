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

Tracking.prototype.flush = function(analytics) {
  var traits = $.tracking.traits;
  var events = $.tracking.events;

  analytics.identify(traits);
  Object.keys(events).forEach(function(name, i) {
    analytics.track(name, events[name]);
  });
}

export default Tracking;

$.extend({ tracking: new Tracking() });
