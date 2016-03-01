import $ from 'jquery';

var isFunction;

function Zen(callback) {
  if (!(this instanceof Zen)) return new Zen(callback);
  this.remind(callback) || this.retrieve(callback);
};

Zen.prototype.remind = function(callback) {
  var enlightment = this.getEnlightenment();
  if (!enlightment) return false;
  callback.call(self, enlightment);
  return enlightment;
};

Zen.prototype.retrieve = function(callback) {
  var self, url;
  self = this;
  // url  = 'http://localhost:3000/says';
  // url  = 'https://github.com/zen';
  url  = 'https://zenkaffe.herokuapp.com/says';
  return $.get(url, function(enlightenment) {
    self.setEnlightenment(enlightenment);
  }).then(function() {
    callback.call(self, self.getEnlightenment());
  });
};

Zen.prototype.getEnlightenment = function() {
  return this.enlightenment || (this.enlightenment = this.cookie('enlightenment'));
};

Zen.prototype.setEnlightenment = function(enlightenment) {
  var self = this;
  self.enlightenment = enlightenment;
  self.cookie('enlightenment', enlightenment, { expires: 0.1 });
  return enlightenment;
};

Zen.prototype.cookie = function(key, value, opts) {
  if (!isFunction($.cookie)) return false;
  return $.cookie('zen-' + key, value, opts);
};

isFunction = function(obj) {
  return typeof obj === 'function';
}

export default Zen;

$.extend({ zen: Zen });
