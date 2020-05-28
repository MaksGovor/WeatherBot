'use strict';

const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const moongose = require('mongoose');

const commands = require('./data/answers.json');
const options = require('./data/options.json');
const links = require('./data/links.json');

const { token, apiKey, dbUrl } = require('./data/config.js');
const EventEmitter = require('./lib/EventEmitter.js');
const { maybe, path } = require('./lib/maybe.js');
const { pop, shift } = require('./lib/list.js');
const { helper } = require('./lib/display.js');
const fetch = require('./lib/fetch.js');
const { mdThisTimeWeather, mdFor5Day, mdCovid19 } = require('./data/metaData.js');
const UserShema = require('./models/user.js');

const bot = new Telegraf(token, options);
const User = moongose.model('users', UserShema);
const { leave } = Stage;
const stage = new Stage();
const ee = new EventEmitter();

(async () => {
  try {
    await moongose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (err) {
    console.log(`Date base not connected.Error:${err.message}`);
  }
})();

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
          if (typeof transform === 'function') {
            val = transform(val);
          } else {
            val = Array.isArray(val) ?
              val.map(projection(transform)) : val = projection(transform)(val);
          }
        }
        hash[key] = val;
      }
    }
    return hash;
  };
  return mapper;
};


// Make groups of objects by a common field

const groupedByField = (arr, key) => {
  const groups = new Object();
  const result = new Array();
  arr.forEach(obj => {
    const value = obj[key];
    if (!(value in groups)) {
      groups[value] = [];
      result.push(groups[value]);
    }
    groups[value].push(obj);
  });
  return result;
};

// Updating data about user in database

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
      } else {
        res = new Shema(newShema);
      }
      res.save();
    })
    .catch(err => {
      throw new Error(err);
    });
  return res;
};

//

const sweip = async (ctx, sweiper) => {
  const telegramId = path(ctx)('update.callback_query.from.id').getData();
  const data = await User.findOne({ telegramId })
    .then(data => (data ? data : null))
    .catch(err => ctx.reply('!!!Error ' + err.message));
  try {
    const msgId = path(ctx)('update.callback_query.message.message_id').getData();
    await ctx
      .telegram
      .editMessageText(ctx.chat.id, msgId, msgId, sweiper(data.component)[0], Extra.markup(keyboard));
    updateData({ telegramId }, { telegramId, component: data.component, last: data.last }, User);
  } catch (err) {
    await ctx.reply('!!!Error ' + err.message);
  }
};

const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString();
};

// Main

const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton('⬅', 'left'),
  Markup.callbackButton('➡', 'right'),
]);

const locationButton = Markup.keyboard([
  Markup.locationRequestButton('Send location'),
]);

const project5D = projection(mdFor5Day);
const projectTD = projection(mdThisTimeWeather);
const projectCV19 = projection(mdCovid19);

// Bot functions

bot.use(session());
bot.use(stage.middleware());

bot.start(ctx => ctx.reply(commands.start));
bot.help(ctx => ctx.telegram.sendMessage(ctx.chat.id, commands.help, Extra.markup(locationButton)));

bot.on('location', ctx => {
  const { latitude, longitude } = ctx.message.location;
  const telegramId = path(ctx)('update.message.from.id').getData();
  fetch(`${links.openWeatherMap}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
    .then(data => {
      updateData({ telegramId }, { telegramId, component: {}, last: data.name }, User);
      maybe(data)(projectTD)(helper)(ctx.reply);
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weather', async ctx => {
  let text = getTownFromMsg(ctx.message.text);
  const telegramId = path(ctx)('update.message.from.id').getData();
  if (!text) {
    text = await User.findOne({ telegramId })
      .then(data => (data ? data.last : ''))
      .catch(err => ctx.reply('!!!Error ' + err.message));
  }
  fetch(`${links.openWeatherMap}/weather?q=${text}&appid=${apiKey}`)
    .then(data => {
      maybe(data)(projectTD)(helper)(ctx.reply);
      updateData({ telegramId }, { telegramId, component: {}, last: data.name }, User);
      const text = path(data)('sys.country').getData();
      fetch(`${links.postmanCV19}/${text}`)
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
  if (!text) {
    text = await User.findOne({ telegramId })
      .then(data => (data ? data.last : ''))
      .catch(err => ctx.reply('!!!Error ' + err.message));
  }
  fetch(`${links.openWeatherMap}/forecast?q=${text}&appid=${apiKey}`)
    .then(data => {
      const loggered = maybe(data)
        .map(project5D)
        .map(d => groupedByField(d.list, 'date'))
        .map(d => d.map(gr => gr.map(helper)))
        .chain(d => d.map(gr => gr.join('\n' + '_'.repeat(40) + '\n')));
      (async () => {
        await ctx.reply('🌇 City: ' + data.city.name);
        await ctx.telegram.sendMessage(ctx.chat.id, loggered[0], Extra.markup(keyboard));
        updateData({ telegramId }, { telegramId, component: loggered, last: data.city.name }, User);
      })();
    })
    .catch(err => ctx.reply('!!!Error ' + err.message));
});

bot.command('weathercomment', ctx => ctx.scene.enter('weatherComment'));

bot.command('reviews', async ctx => {
  const telegramId = path(ctx)('update.message.from.id').getData();
  let text = getTownFromMsg(ctx.message.text);
  if (!text) {
    text = await User.findOne({ telegramId })
      .then(data => (data ? data.last : ''))
      .catch(err => ctx.reply('!!!Error ' + err.message));
  }
  ee.emit(text, ctx.reply);
});

// Scenes

const weatherComment = new Scene('weatherComment');

weatherComment.enter(ctx => ctx.reply(commands.comment));

weatherComment.on('message', async ctx => {
  const text = path(ctx)('update.message.text').getData();
  if (text === '/cancel') {
    ctx.scene.leave();
    return;
  }
  const telegramId = path(ctx)('update.message.from.id').getData();
  const from = path(ctx)('update.message.from.username').getData();
  const answer = `${text}\nFrom: @${from || 'Noname'}\nToday at ${new Date().toLocaleTimeString()}`;
  const city = await User.findOne({ telegramId })
    .then(data => (data ? data.last : ''))
    .catch(err => ctx.reply('!!!Error ' + err.message));
  ee.limit(city, logger => logger(answer), getTomorrow());
  ctx.scene.leave();
});

weatherComment.leave(ctx => ctx.reply(commands.leave));

// Scene registration

stage.register(weatherComment);
stage.command('cancel', leave());

// Actions

bot.action('delete', ({ deleteMessage }) => deleteMessage());

bot.action('right', ctx => sweip(ctx, shift));

bot.action('left', ctx => sweip(ctx, pop));

bot.launch();
