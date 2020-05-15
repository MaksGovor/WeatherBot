'use strict';

const { Telegraf } = require('telegraf');
const moongose = require('mongoose');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const commands = require('./answers.json');
const options = require('./options.json');

const { token, apiKey, dbKey } = require('./config')
const { maybe, path } = require('./maybe.js');
const {pop, shift} = require('./list.js');
const { helper } = require('./display.js');
const fetch = require('./fetch.js');
const { mdThisTimeWeather, mdFor5Day, mdCovid19 } = require('./metaData.js');
const UserShema = require('./models/user.js');

const bot = new Telegraf(token, options);
const User = moongose.model('users', UserShema);

const getTownFromMsg = msg => msg.split(' ').slice(1).join(' ');

(async () => {
  try {
    await moongose.connect(dbKey, {
      useNewUrlParser: true,
      useUnifiedTopology: true      
    })
  } catch (err) {
    throw new Error(err);
  }
})();

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

const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton('⬅', 'left'),
  Markup.callbackButton('➡', 'right'),
]);

const project5D = projection(mdFor5Day);
const projectTD = projection(mdThisTimeWeather);
const projectCV19 = projection(mdCovid19);

// Bot functions

bot.start(ctx => ctx.reply(commands.start));
bot.help(ctx => ctx.reply(commands.help));

bot.on('location', ctx => {
  const { latitude, longitude } = ctx.message.location;
  const telegramId = path(ctx)('update.message.from.id').getData(); 
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
    .then(data => {
      updateData({telegramId}, {telegramId, component: {}, last: data.name}, User);
      maybe(data)(projectTD)(helper)(ctx.reply);
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weather', async ctx => {
  let text = getTownFromMsg(ctx.message.text);
  const telegramId = path(ctx)('update.message.from.id').getData();
  if (!text){
      text = await User.findOne({telegramId})
        .then(data => data ? data.last : '')
        .catch(err => ctx.reply('!!!Error ' + err.message));
  };
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${text}&appid=${apiKey}`)
    .then(data => {
      maybe(data)(projectTD)(helper)(ctx.reply);
      updateData({telegramId}, {telegramId, component: {}, last: data.name}, User);
      const text = data.sys.country;
      fetch(`https://api.covid19api.com/total/dayone/country/${text}`)
        .then(data => {
          ctx.reply(commands.cv19 + maybe(data.pop())(projectCV19).chain(helper));
        })
        .catch(err => ctx.reply('!!!Error ' + err.message));
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weather5days', async ctx => {
  const telegramId = path(ctx)('update.message.from.id').getData();
  let text = getTownFromMsg(ctx.message.text);
  if (!text){
    text = await User.findOne({telegramId})
      .then(data => data ? data.last : '')
      .catch(err => ctx.reply('!!!Error ' + err.message));
  }
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${text}&appid=${apiKey}`)
    .then( data => {
      const loggered = maybe(data)
        .map(project5D)
        .map(d => groupedByField(d.list, 'date'))
        .map(d => d.map(gr => gr.map(helper)))
        .chain(d => d.map(gr => gr.join('\n' + '_'.repeat(40) + '\n')));
      (async () => {
      await ctx.reply('🌇 City: ' + data.city.name);
      await ctx.telegram.sendMessage(ctx.chat.id, loggered[0], Extra.markup(keyboard));
      updateData({telegramId}, {telegramId, component: loggered, last: data.city.name}, User);
      })();
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.action('delete', ({ deleteMessage }) => deleteMessage());

bot.action('right', async ctx => {
  const telegramId = path(ctx)('update.callback_query.from.id').getData();
  const data = await User.findOne({telegramId})
    .then(data => data ? data : null)
    .catch(err => ctx.reply('!!!Error ' + err.message));
  try {
    const msgId = path(ctx)('update.callback_query.message.message_id').getData();
    await ctx.telegram.editMessageText(ctx.chat.id, msgId, msgId, shift(data.component)[0], Extra.markup(keyboard));
    updateData({telegramId}, {telegramId, component: data.component, last: data.last}, User);
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});

bot.action('left', async ctx => {
  const telegramId = path(ctx)('update.callback_query.from.id').getData();
  const data = await User.findOne({telegramId})
    .then(data => data ? data : null)
    .catch(err => ctx.reply('!!!Error ' + err.message));
  try {
    const msgId = path(ctx)('update.callback_query.message.message_id').getData();
    await ctx.telegram.editMessageText(ctx.chat.id, msgId, msgId, pop(data.component)[0], Extra.markup(keyboard));
    updateData({telegramId}, {telegramId, component: data.component, last: data.last}, User);
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
});

bot.launch();
