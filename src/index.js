'use strict';

const { Telegraf } = require('telegraf');
const request = require('request');
const config = require('./config.json');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const { helper } = require('./display.js');

const TOKEN = process.env.BOT_TOKEN || config.token;
const apiKey = config['api-key'];
const bot = new Telegraf(TOKEN, config.options);

const getTownFromMsg = msg => msg.split(' ').slice(1).join(' ');


// Project data by metadata

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
};

// Make groups by a common field

const groupedByField = (arr, key) => {
  const groups = new Object(), result = new Array();
  arr.forEach(obj => {
      if (!(obj[key] in groups)) {
          groups[obj[key]] = [];
          result.push(groups[obj[key]]);
      }
      groups[obj[key]].push(obj);
  });
  return result;
}

const mdFor5Day = {
  list: ['list', {
    temp: ['main', {
      average: ['temp', t => `Average temperature: ${Math.floor(+t - 273)}℃`],
      feelsLike: ['feels_like', t => `Feels like temperature: ${Math.floor(+t - 273)}℃`],
      min: ['temp_min', t => `Min temperature: ${Math.floor(+t - 273)}℃`],
      max: ['temp_max', t => `Max temperature: ${Math.floor(+t - 273)}℃`],
    }],
    weather: ['weather', {
      main: ['main', x => `At that time the weather is: ${x}`],
      description: ['description', x => `More about the weather: ${x}`],
    }],
    wind: ['wind', {
      speed: ['speed', s => `The wind speed is ${s} m/s`],
    }],
    rain: ['rain', r => `Chanse of presipitation is ${r['3h']}`],
    date: ['dt_txt', d => `Date: ${d.split(' ').shift()}`],
    time: ['dt_txt', d => `Time: ${d.split(' ').pop()}`],
  }],
  city: ['city', {
    name: ['name', x => x],
    country: ['country', x => x],
    sunrise: ['sunrise', x => new Date(x * 1000).toLocaleString()],
    sunset: ['sunset', x => new Date(x * 1000).toLocaleString()],
  }]
};

const mdThisTimeWeather = {
  name: ['name', x => `City: ${x}`],
  date: ['dt', d => `Date: ${new Date().toString()}`],
  temp: ['main', {
    average: ['temp', t => `Average temperature: ${Math.floor(+t - 273)}℃`],
    feelsLike: ['feels_like', t => `Feels like temperature: ${Math.floor(+t - 273)}℃`],
    min: ['temp_min', t => `Min temperature: ${Math.floor(+t - 273)}℃`],
    max: ['temp_max', t => `Max temperature: ${Math.floor(+t - 273)}℃`],
  }],
  weather: ['weather', {
    main: ['main', x => `At that time the weather is: ${x}`],
    description: ['description', x => `More about the weather: ${x}`],
  }],
  wind: ['wind', {
    speed: ['speed', s => `The wind speed is ${s} m/s`],
  }],
  rain: ['rain', r => `Chanse of presipitation is ${r['3h']}`],
}

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('author', 'https://github.com/MaksGovor'),
  Markup.callbackButton('Delete', 'delete')
]);


// Usage

const project5D = projection(mdFor5Day);
const projectTD = projection(mdThisTimeWeather);

bot.start(ctx => ctx.reply('Hello'));

bot.command('weather', ctx => {
  const text = getTownFromMsg(ctx.message.text);
  console.log(text);
  request('https://api.openweathermap.org/data/2.5/weather?q=' + text + '&appid=' + apiKey,
    (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        if (!err) ctx.reply(helper(projectTD(data)));
      } catch (err) {
        ctx.reply('!!!Error ' + err.message);
      }
    });
});

bot.command('weather5days', ctx => {
  const text = getTownFromMsg(ctx.message.text);
  console.log(text);
  request('https://api.openweathermap.org/data/2.5/forecast?q=' + text + '&appid=' + apiKey,
    (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        const grouped = groupedByField(project5D(data).list, 'date');
        if (!err) ctx.reply(grouped[1].map(helper).join('\n' + '_'.repeat(40) + '\n'));
      } catch (err) {
        ctx.reply('!!!Error ' + err.message);
      }
    });
});

bot.launch();



// Testing API part
request('https://api.openweathermap.org/data/2.5/forecast?q=Krolevets&appid=' + apiKey,
  (err, reaponse, data) => {
    if (!err) {
      data = JSON.parse(data);
      const grouped = groupedByField(project5D(data).list, 'date');
      console.log(grouped.map(helper)[0]);
    }
  }
);


//console.log(config.options);
