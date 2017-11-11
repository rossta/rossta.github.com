import $ from 'jquery';

const isFunction = obj => typeof obj === 'function';

const cookie = (key, value, opts) => {
  if (!isFunction($.cookie)) return false;
  return $.cookie(`zen-${key}`, value, opts);
};

class Zen {
  zen(callback) {
    this.remind(callback) || this.retrieve(callback);
  }

  remind(callback) {
    const enlightment = this.getEnlightenment();
    if (!enlightment) return false;
    callback.call(this, enlightment);
    return enlightment;
  }

  retrieve(callback) {
    const url = 'https://zenkaffe.herokuapp.com/says';
    // url  = 'http://localhost:3000/says';
    // url  = 'https://github.com/zen';

    return $.get(url, (enlightenment) => {
      this.setEnlightenment(enlightenment);
    }).then(() => {
      callback.call(this, this.getEnlightenment());
    });
  }

  getEnlightenment() {
    if (!this.enlightenment) this.enlightenment = cookie('enlightenment');
    return this.enlightenment;
  }

  setEnlightenment(enlightenment) {
    this.enlightenment = enlightenment;
    cookie('enlightenment', enlightenment, { expires: 0.1 });
    return enlightenment;
  }
}

export default Zen;

$.extend({ zen: new Zen().zen });
