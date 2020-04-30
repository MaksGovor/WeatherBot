'use strict';

const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const request = require('request');
const config = require('./config.json');
const TOKEN = process.env.BOT_TOKEN || config.token;
const apiKey = config["api-key"];
const bot = new Telegraf(TOKEN, config.options);

const getTownFromMsg = msg => msg.split(' ').slice(1).join(' ');

const projection = metadata => {
  const keys = Object.keys(metadata);
  const mapper = data => {
    const hash = new Object();
    for (const key of keys) {
      const def = metadata[key];
      const [name, transform] = def;
      let val = data[name];
      if (val) {
        if (transform) {
          val = typeof transform === 'function' ?
            transform(val) : val.map(projection(transform));
        }
        hash[key] = val;
      }
    }
    return hash;
  };
  return mapper;
}
 

// Usage 

const mdFor5Day = {
}

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('author', 'https://github.com/MaksGovor'),
  Markup.callbackButton('Delete', 'delete')
]);

//bot.on('message', ctx => {
//  console.log(ctx.message);
//});

bot.start(ctx => ctx.reply('Hello'));

bot.command('weather', ctx => {
  const text = getTownFromMsg(ctx.message.text);
  console.log(text);
  request('https://api.openweathermap.org/data/2.5/weather?q=' + text + '&appid=' + apiKey,
    (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        if (!err) ctx.reply(data.weather[0].main + '\n' + data.weather[0].description);
      } catch (err) {
        ctx.reply('!!!Error ' + err.message);
      }
  });
})

//bot.launch();

request('https://api.openweathermap.org/data/2.5/forecast?q=Krolevets&appid=' + apiKey,
  (err, reaponse, data) => {
    if (!err){
      data = JSON.parse(data);
      console.dir(data, {depth: 3});
    }
  }
)


//console.log(config.options);
