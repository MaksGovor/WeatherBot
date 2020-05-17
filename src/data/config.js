require('dotenv').config();

const token = process.env.TOKEN;

const apiKey = process.env.API_KEY;

const dbKey = `mongodb+srv://maksgovor:${process.env.DB_KEY}@cluster0-9xphr.mongodb.net/users?retryWrites=true&w=majority`;

module.exports = { token, apiKey, dbKey };