'use strict';

const { Telegraf } = require('telegraf');
const request = require('request');
const moongose = require('mongoose');

const config = require('./config.json');

const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const List = require('./list.js');

const { helper } = require('./display.js');
const commands = require('./answers.json');
const fetch = require('./fetch.js');
const { mdThisTimeWeather, mdFor5Day, mdCovid19 } = require('./metaData.js');
const User = require('./user.js');
const UserShema = require('./models/user.js');

const TOKEN = process.env.BOT_TOKEN || config.token;
const apiKey = config['api-key'];
const bot = new Telegraf(TOKEN, config.options);
const User1 = moongose.model('users', UserShema);

const getTownFromMsg = msg => msg.split(' ').slice(1).join(' ');

(async () => {
  try {
    await moongose.connect(config["db-key"], {
      useNewUrlParser: true,
      useUnifiedTopology: true      
    })
  } catch (err) {
    throw new Error(err);
  }
})();

User1.find({telegramId: 692827211}).then(d => console.log(d));
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

const updateData = (finder, newShema, Shema) => {
  let res;
  Shema.findOne(finder)
    .then(data => {
      if (data) {
        const keys = Object.keys(newShema);
        for (const key of keys) {
          data[key] = newShema[key];
        }      
        res = data;
      }
      else {
        res = new Shema(newShema);
      }
      res.save();
    })
    .catch(err => {
      throw new Error(err);
    })
  return res;
}

//const k  = updateData({telegramId: 111}, {telegramId:111, component: {aaa: 1}, last: 'aua'}, User1, {component: {aa: 'aaa'}});

//const f = updateData({telegramId: 12234}, {telegramId: 12234, component: {me: 'be'}, last: 'Chui'}, User1, {component: {fa: 14}})


const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton('⬅', 'left'),
  Markup.callbackButton('➡', 'right'),
]);

const project5D = projection(mdFor5Day);
const projectTD = projection(mdThisTimeWeather);
const projectCV19 = projection(mdCovid19);
const user = new User();

// Bot functions

bot.start(ctx => ctx.reply(commands.start));
bot.help(ctx => ctx.reply(commands.help));

bot.on('location', ctx => {
  const { latitude, longitude } = ctx.message.location;
  const telegramId = ctx.update.message.from.id;
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
    .then(data => {
      updateData({telegramId}, {telegramId, component: {}, last: data.name}, User1);
      ctx.reply(helper(projectTD(data)));
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weather', async ctx => {
  let text = getTownFromMsg(ctx.message.text);
  const telegramId = ctx.update.message.from.id;
  if (!text){
      text = await User1.findOne({telegramId})
        .then(data => data ? data.last : '')
        .catch(err => ctx.reply('!!!Error ' + err.message));
  };
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${text}&appid=${apiKey}`)
    .then(data => {
      updateData({telegramId}, {telegramId, component: {}, last: data.name}, User1);
      ctx.reply(helper(projectTD(data)));
      const text = data.sys.country;
      fetch(`https://api.covid19api.com/total/dayone/country/${text}`)
        .then(data => {
          ctx.reply('❗BE CAREFUL❗\nCOVID-19 in your counrty\n' + helper(projectCV19(data.pop())));
        })
        .catch(err => ctx.reply('!!!Error ' + err.message));
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weather5days', async ctx => {
  const telegramId = ctx.update.message.from.id;
  let text;
  if (!text){
    text = await User1.findOne({telegramId})
      .then(data => data ? data.last : '')
      .catch(err => ctx.reply('!!!Error ' + err.message));
  }
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${text}&appid=${apiKey}`)
    .then( data => {
      const parseData = project5D(data);
      user.last = parseData.city.name;
      const grouped = groupedByField(parseData.list, 'date');
      const loggered = grouped.map(group =>
        group
          .map(helper)
          .join('\n' + '_'.repeat(40) + '\n'));
      const list = new List();
      loggered.forEach(comp => list.push(comp));
      user.component = list.first;
      (async () => {
      await ctx.reply('🌇 City: ' + parseData.city.name);
      await ctx.telegram.sendMessage(ctx.chat.id, user.component.data, Extra.markup(keyboard));
      })();
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.action('delete', ({ deleteMessage }) => deleteMessage());

bot.action('right', async ctx => {
  try {
    user.component = user.component.next ? user.component.next : user.component.list.first;
    const msgId = ctx.update.callback_query.message.message_id;
    await ctx.telegram.editMessageText(ctx.chat.id, msgId, msgId, user.component.data, Extra.markup(keyboard));
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});

bot.action('left', async ctx => {
  try {
    user.component = user.component.prev ? user.component.prev : user.component.list.last;
    const msgId = ctx.update.callback_query.message.message_id;
    await ctx.telegram.editMessageText(ctx.chat.id, msgId, msgId, user.component.data, Extra.markup(keyboard));
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});

bot.launch();
