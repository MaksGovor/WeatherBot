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
      const definition = metadata[key];
      const [name, transform] = definition;
      let val = data[name];
      if (val) {
        if (transform) {
          val = typeof transform === 'function' ?
            transform(val) : Array.isArray(val) ? 
              val.map(projection(transform)) : val = projection(transform)(val);
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
  list: ['list', {
    temp: ['main', {
      average: ['temp', t => `${Math.floor(+t - 273)}℃`],
      feelsLike: ['feels_like', t => `${Math.floor(+t - 273)}℃`],
      min: ['temp_min', t => `${Math.floor(+t - 273)}℃`],
      max: ['temp_max', t => `${Math.floor(+t - 273)}℃`],    
    }],
    weather: ['weather', {
      main: ['main', x => `At that time the weather is: ${x}`],
      description: ['description', x => `More about the weather: ${x}`],
    }],
    wind: ['wind', {
      speed: ['speed', s => `The wind speed is ${s} m/s`],
    }],
    rain: ['rain', r => `Chanse of presipitation is ${r['3h']}`],
    date: ['dt_txt', d => d],
  }],
  city: ['city', {
    name: ['name', x => x],
    country: ['country', x => x],
    sunrise: ['sunrise', x => new Date(x*1000).toLocaleString()],
    sunset: ['sunset', x => new Date(x*1000).toLocaleString()],
  }]
}

const testp = projection(mdFor5Day);

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('author', 'https://github.com/MaksGovor'),
  Markup.callbackButton('Delete', 'delete')
]);

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

bot.command('weather5days', ctx => {
  const text = getTownFromMsg(ctx.message.text);
  console.log(text);
  request('https://api.openweathermap.org/data/2.5/forecast?q=' + text + '&appid=' + apiKey,
    (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        if (!err) ctx.reply(data.list.map(testp)[0]);
      } catch (err) {
        ctx.reply('!!!Error ' + err.message);
      }
  });
})


bot.launch();

request('https://api.openweathermap.org/data/2.5/forecast?q=Krolevets&appid=' + apiKey,
  (err, reaponse, data) => {
    if (!err){
      data = JSON.parse(data);
      console.dir(testp(data), {depth: 2});
    }
  }
)


//console.log(config.options);
