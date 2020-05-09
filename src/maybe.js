'use strict';

const maybe = x => {
  const map = fn => maybe(x ? fn(x) : null);
  const ap = functor => functor.map(f => x && f ? f(x) : null);
  const chain = f => f(x);
  const getData = () => x;
  return Object.assign(map, { map, ap, chain, getData });
};

const path = data => (
  path => (
    fp.maybe(path)(path => (
      path.split('.').reduce(
        (prev, key) => (prev[key] || {}),
        (data || {})
      )
    ))
  )
);

module.exports = { maybe, path };