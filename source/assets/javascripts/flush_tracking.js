if ($ && $.tracking) {
  var traits = $.tracking.traits;
  var events = $.tracking.events;

  analytics.identify(traits);
  Object.keys(events).forEach(function(name, i) {
    analytics.track(name, events[name]);
  });

} else {
  analytics.identify();
}
