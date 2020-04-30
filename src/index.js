'use strict';

const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const request = require('request');
const config = require('./config.json');
const TOKEN = process.env.token || config.token;
const apiKey = config["api-key"];

const bot = new Telegraf(TOKEN, config.options);

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('author', 'https://github.com/MaksGovor'),
  Markup.callbackButton('Delete', 'delete')
]);

bot.start(ctx => ctx.reply('Hello'));

//bot.launch();

//bot.launch();

request('https://api.openweathermap.org/data/2.5/weather?q=Kieve&appid=' + apiKey,
  (err, reaponse, data) => {
    data = JSON.parse(data);
    if (!err) console.dir(data);
});

console.log(config.options);
