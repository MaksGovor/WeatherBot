'use strict';

const mongoose = require('mongoose');

const Shema = mongoose.Schema;

const UserShema = new Shema({
  telegramId: {
    type: Number,
    required: true
  },
  component: {
    type: Object,
    required: true
  },
  last: {
    type: String,
    required: true
  }
  /*cities: {
    type: Array,
    required: true
  }*/
})

module.exports = UserShema;