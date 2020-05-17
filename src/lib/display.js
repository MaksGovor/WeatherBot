'use strict';

const helper = src => {
  const iterable = Array.isArray(src) ? src : [src];
  const keys = Object.keys(iterable[0]);
  const res = iterable.map(obj => keys.map(
    key => obj[key] instanceof Object ? helper(obj[key]) : obj[key].toString()
  ));
  return res.map(row => row.join('\n')).join('\n');
};

module.exports.helper = helper;