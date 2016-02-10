var Botkit = require('botkit');

var controller = Botkit.slackbot({
  json_file_store: './db/'
}).configureSlackApp();

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

controller.setupWebserver(process.env.PORT || 5000, function (err, express_webserver) {
  controller.createWebhookEndpoints(express_webserver)
});

controller.on('vote', function (bot, message) {
  // reply to slash command
  bot.reply(message,'Everyone can see this part of the slash command');
});

