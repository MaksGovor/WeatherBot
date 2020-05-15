'use strict';

function EventEmitter () {
  this.events = new Map();
  this.wrappers = new Map();
}

EventEmitter.prototype.on = function(name, fn) {
  const event = this.get(name);
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