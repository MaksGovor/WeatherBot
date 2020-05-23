'use strict';

function EventEmitter () {
  this.events = new Map();
  this.wrappers = new Map();
  this.temporary = new Map();
}

EventEmitter.prototype.on = function(...args) {
  const fn = args.pop();
  if (typeof fn !== 'function') return;
  for (const name of args) {
    const event = this.events.get(name);
    if (event) event.add(fn);
    else this.events.set(name, new Set([fn]));
  }
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
    if (event.size === 0) this.events.delete(name);
    return;
  }
  const wrapper = this.wrappers.get(fn);
  if (wrapper) {
    this.wrappers.delete(fn);
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

EventEmitter.prototype.limit = function(name, fn, date) {
  const wrapper = (...args) => {
    if (date === new Date().toLocaleDateString()){
      //this.remove(name, wrapper);
      //return;
    }
    fn(...args);
  };
  this.temporary.set(date, name);
  this.on(name, wrapper);
}

EventEmitter.prototype.deleteMissed = function() {
  for (const date of this.temporary.keys()) {
    if (new Date() >= new Date(date)){
      const name = this.temporary.get(date);
      const event = this.events.get(name);
      this.temporary.delete(date);
      for (const fn of event.values()){
        this.remove(name, fn)
      }
    }
  }
}

module.exports = EventEmitter;