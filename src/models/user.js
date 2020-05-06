'use strict';

const mongoose = require('mongoose');

const Shema = mongoose.Schema;

const UserShema = new Shema({
  telegramId: {
    type: Number,
    required: true
  },
  list: {
    type: Object,
    required: true
  },
  /*cities: {
    type: Array,
    required: true
  }*/
})

module.exports = UserShema;