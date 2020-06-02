'use strict';

require('dotenv').config();

const token = process.env.TOKEN;

const apiKey = process.env.API_KEY;

const dbUrl = process.env.DB_URL;

module.exports = { token, apiKey, dbUrl };
