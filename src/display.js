'use strict';

const helper = src => {
  if (Array.isArray(src)) src = src.shift();
  const keys = Object.keys(src);
  const res = [src].map(obj => keys.map(
    (key) => obj[key] instanceof Object ? helper(obj[key]) : obj[key].toString()
  ));
  return res.map(row => row.join('\n')).join('\n');
};

module.exports.helper = helper;