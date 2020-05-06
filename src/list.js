'use strict';

const pop = arr => {
  const element = arr.pop();
  arr.unshift(element);
  return element;
};

const shift = arr => {
  const element = arr.shift();
  arr.push(element);
  return element;
}

module.exports = {pop, shift};