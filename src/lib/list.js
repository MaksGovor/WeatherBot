'use strict';

const pop = arr => {
  const element = arr.pop();
  arr.unshift(element);
  return arr;
};

const shift = arr => {
  const element = arr.shift();
  arr.push(element);
  return arr;
}

module.exports = { pop, shift };