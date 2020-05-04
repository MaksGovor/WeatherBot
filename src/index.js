'use strict';

const { Telegraf } = require('telegraf');
const request = require('request');
const config = require('./config.json');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const { helper } = require('./display.js');
const List = require('./list.js');
const commands = require('./answers.json');

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
};

const mdFor5Day = {
  list: ['list', {
    temp: ['main', {
      average: ['temp', t => `🌡️ Average temperature: ${Math.round(+t - 273)}℃`],
      feelsLike: ['feels_like', t => `🌡️ Feels like temperature: ${Math.round(+t - 273)}℃`],
      min: ['temp_min', t => `🌡️ Min temperature: ${Math.round(+t - 273)}℃`],
      max: ['temp_max', t => `🌡️ Max temperature: ${Math.round(+t - 273)}℃`],
    }],
    weather: ['weather', {
      main: ['main', x => `🛰️ At that time the weather is: ${x}`],
      description: ['description', x => `🛰️ More about the weather: ${x}`],
    }],
    wind: ['wind', {
      speed: ['speed', s => `🌪️ The wind speed is ${s} m/s`],
    }],
    rain: ['rain', r => `🌧️ Chanse of presipitation is ${r['3h']}`],
    date: ['dt_txt', d => `📅 Date: ${d.split(' ').shift()}`],
    time: ['dt_txt', d => `⏰ Time: ${d.split(' ').pop()}`],
  }],
  city: ['city', {
    name: ['name', x => x],
    country: ['country', x => x],
    sunrise: ['sunrise', x => new Date(x * 1000).toLocaleString()],
    sunset: ['sunset', x => new Date(x * 1000).toLocaleString()],
  }]
};

const mdThisTimeWeather = {
  name: ['name', x => `🌇 City: ${x}`],
  date: ['dt', d => `📅 Date: ${new Date().toString().split(' ').slice(1, 5).join(' ')}`],
  temp: ['main', {
    average: ['temp', t => `🌡️ Average temperature: ${Math.round(+t - 273)}℃`],
    feelsLike: ['feels_like', t => `🌡️ Feels like temperature: ${Math.round(+t - 273)}℃`],
    min: ['temp_min', t => `🌡️ Min temperature: ${Math.round(+t - 273)}℃`],
    max: ['temp_max', t => `🌡️ Max temperature: ${Math.round(+t - 273)}℃`],
  }],
  weather: ['weather', {
    main: ['main', x => `🛰️ At that time the weather is: ${x}`],
    description: ['description', x => `🛰️ More about the weather: ${x}`],
  }],
  wind: ['wind', {
    speed: ['speed', s => `🌪️ The wind speed is ${s} m/s`],
  }],
  rain: ['rain', r => `🌧️ Chanse of presipitation is ${r['3h']}`],
};

const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton('⬅', 'left'),
  Markup.callbackButton('➡', 'right'),
]);


// Usage

const project5D = projection(mdFor5Day);
const projectTD = projection(mdThisTimeWeather);

bot.start(ctx => ctx.reply(commands.start));
bot.help(ctx => ctx.reply(commands.help));

bot.on('location', ctx => {
  const { latitude, longitude } = ctx.message.location;
  request(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`,
    async (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        if (!err) {
          bot.last = data.name;
          await ctx.reply(helper(projectTD(data)));
        }
      } catch (err) {
        await ctx.reply('!!!Error ' + err.message);
      }
    })
});

bot.command('weather', async ctx => {
  const text = !getTownFromMsg(ctx.message.text) ? bot.last : getTownFromMsg(ctx.message.text);
  if (!text) return;
  request('https://api.openweathermap.org/data/2.5/weather?q=' + text + '&appid=' + apiKey,
    async (err, reaponse, data) => {
      try {
        data = JSON.parse(data);
        bot.last = data.name;
        if (!err) {
          await ctx.reply(helper(projectTD(data)));
        }
      } catch (err) {
        await ctx.reply('!!!Error ' + err.message);
      }
    });
});

bot.command('weather5days', async ctx => {
  const text = !getTownFromMsg(ctx.message.text) ? bot.last : getTownFromMsg(ctx.message.text);
  if (!text) return;
  request('https://api.openweathermap.org/data/2.5/forecast?q=' + text + '&appid=' + apiKey,
    async (err, reaponse, data) => {
      try {
        if (!err) {
          data = project5D(JSON.parse(data));
          bot.last = data.city.name;
          const grouped = groupedByField(data.list, 'date');
          const loggered = grouped.map(group =>
            group
              .map(helper)
              .join('\n' + '_'.repeat(40) + '\n'));
          const list = new List();
          loggered.forEach(comp => list.push(comp));
          bot.component = list.first;
          await ctx.reply('🌇 City: ' + data.city.name);
          await ctx.telegram.sendMessage(ctx.chat.id, bot.component.data, Extra.markup(keyboard));
        }
      } catch (err) {
        await ctx.reply('!!!Error ' + err.message);
      }
    });
});



// Actions

bot.action('delete', ({ deleteMessage }) => deleteMessage());

bot.action('right', async ctx => {
  ctx.deleteMessage();
  try {
    bot.component = bot.component.next ? bot.component.next : bot.component.list.first;
    await ctx.telegram.sendMessage(ctx.chat.id, bot.component.data, Extra.markup(keyboard));
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});

bot.action('left', async ctx => {
  ctx.deleteMessage();
  try {
    bot.component = bot.component.prev ? bot.component.prev : bot.component.list.last;
    await ctx.telegram.sendMessage(ctx.chat.id, bot.component.data, Extra.markup(keyboard));
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});


bot.launch();

// Testing API part

/*request('https://api.openweathermap.org/data/2.5/forecast?q=Krolevets&appid=' + apiKey,
  (err, reaponse, data) => {
    if (!err) {
      data = JSON.parse(data);
      const grouped = groupedByField(project5D(data).list, 'date');
      console.log(grouped.map(arr => arr.map(helper)));
    }
  }
);*/
