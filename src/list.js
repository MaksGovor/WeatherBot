'use strict';

class Componet {
  constructor(data, prev, next, list) {
    this.list = list;
    this.data = data;
    this.prev = prev;
    this.next = next;
  }
}

class List {
  constructor() {
    this.first = null;
    this.last = null;
  }

  push(data) {
    const last = this.last;
    const componet = new Componet(data, last, null, this);
    if (last) {
      last.next = componet;
      this.last = componet;
    } else {
      this.first = componet;
      this.last = componet;
    }
  }

  unshift(data) {
    const first = this.first; 
    const componet = new Componet(data, null, first, this);
    if (first){
      first.prev = componet;
      this.first = componet;
    } else {
      this.first = componet; 
      this.last = componet;
    }
  }

  pop() {
    const componet = this.last;
    if (!componet) return null;
    if (this.first === componet) {
      this.first = null;
      this.last = null;
    } else {
      this.last = componet.prev;
    }
    return componet.data;
  }

  shift() {
    const componet = this.first;
    if (!componet) return null;
    if (this.last === componet) {
      this.first = null;
      this.last = null;
    } else {
      this.first = componet.next;
    }
    return componet.item;
  }

}

module.exports = List;