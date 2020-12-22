const objectPath = require('object-path');
const { EventEmitter } = require('events');

module.exports = class DotObj extends EventEmitter {
  constructor (o) {
    super();
    Object.assign(this, o, Object.freeze(objectPath(this.watch())));
  }

  watch () {
    const t = this;
    return new Proxy(this, {
      get () {
        return Reflect.get(...arguments);
      },
      set (obj, prop, value) {
        const old = obj[prop];
        obj[prop] = value;
        if (prop !== '_eventsCount' && old !== value && old !== JSON.stringify(value)) t.emit('change', prop, obj[prop], value);
        return true;
      }
    });
  }
};
