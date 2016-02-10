var Botkit = require('botkit');
var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: process.env.BOT_TOKEN
});

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

// give the bot something to listen for.
controller.hears('hello', 'direct_message,direct_mention,mention', function (bot, message) {

  bot.reply(message, 'Hello yourself.');
});
