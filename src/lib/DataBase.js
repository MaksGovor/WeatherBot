'use strict';

const fs = require('fs');

class DataBase {
  constructor(path) {
    this.path = path;
  }

  update(data, id) {
    const db = JSON.parse(fs.readFileSync(this.path));
    db[id] = db[id] || {};
    for (const key in data) {
      db[id][key] = data[key];
    }
    fs.writeFileSync(this.path, JSON.stringify(db));
  }

  getData(id) {
    const db = JSON.parse(fs.readFileSync(this.path));
    if (db[id]) return db[id];
    return false;
  }
}

module.exports = DataBase;
