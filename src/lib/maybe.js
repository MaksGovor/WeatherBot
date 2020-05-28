'use strict';

const maybe = x => {
  const map = fn => maybe(x ? fn(x) : null);
  const ap = functor => functor.map(f => x && f ? f(x) : null);
  const chain = f => f(x);
  const getData = () => x;
  return Object.assign(map, { map, ap, chain, getData });
};

const reducer = (prev, key) => (prev[key] || {});
const fn = path => path.split('.').reduce(reducer, (data || {}));
const path = data => path => maybe(path)(fn);

module.exports = { maybe, path };
