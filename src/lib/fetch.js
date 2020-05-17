'use strict';

const https = require('https');

const fetch = url => new Promise((resolve, reject) => {
  https.get(url, res => {
    const code = res.statusCode;
    if (code !== 200)
      return reject(new Error(`HTTP status code ${code}`));
    res.on('error', reject);
    const chunks = new Array();
    res.on('data', chunk => {
      chunks.push(chunk);
    });
    
    res.on('end', () => {
      const json = Buffer.concat(chunks).toString();
      try {
        const object = JSON.parse(json);
        resolve(object);
      } catch (error) {
        return reject(error);
      }
    });
  });
});

module.exports = fetch;
