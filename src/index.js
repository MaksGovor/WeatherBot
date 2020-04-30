const { Telegraf } = require('telegraf');
const consfig = require('./config.json');

const bot = new Telegraf (consfig.token, consfig.options);

bot.start(ctx => ctx.reply('Hello'));
//bot.launch();

console.log(consfig.options);