'use strict';

function EventEmitter () {
  this.events = new Map();
  this.wrappers = new Map();
}

EventEmitter.prototype.on = function(name, fn) {
  const event = this.events.get(name);
  if (event) event.add(fn);
  else this.events.set(name, new Set([fn]));
};

EventEmitter.prototype.emit = function(name, ...data) {
  const event = this.events.get(name);
  if (event) {
    for (const fn of event.values()) {
      fn(...data);
    }
  }
};

EventEmitter.prototype.remove = function(name, fn) {
  const event = this.events.get(name);
  if (!event) return;
  if (event.has(fn)) {
    event.delete(fn);
    return;
  }
  const wrapper = this.wrappers.get(fn);
  if (wrapper) {
    event.delete(wrapper);
    if (event.size === 0) this.events.delete(name);
  }
}

EventEmitter.prototype.once = function(name, fn) {
  const wrapper = (...args) => {
    this.remove(name, wrapper);
    fn(...args);
  };
  this.wrappers.set(fn, wrapper);
  this.on(name, wrapper);
}

module.exports = EventEmitter;