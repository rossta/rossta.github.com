import $ from 'jquery';

class Tracking {
  constructor() {
    this.traits = {};
    this.events = {};
  }
  identify(props) {
    this.traits = $.extend(this.traits, {}, props);
    return this.traits;
  }

  track(name, props) {
    this.events[name] = $.extend(this.events[name], {}, props);
    return this.events[name];
  }

  flush(analytics) {
    const { traits, events } = this;

    analytics.identify(traits);
    Object.keys(events).forEach((name) => {
      analytics.track(name, events[name]);
    });
  }
}

export default Tracking;

$.extend({ tracking: new Tracking() });
