var Botkit = require('botkit');
var Game = require('./game');


var controller = Botkit.slackbot({
  json_file_store: './db/'
}).configureSlackApp(
  {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['incoming-webhook']
  }
);

controller.setupWebserver(process.env.PORT || 5000, function (err, webserver) {
  controller.createWebhookEndpoints(webserver);
  var game = new Game(controller);

  //game.startGame(controller);

  controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });


});

controller.on('slash_command',function(bot, message) {
  console.log(message);
  bot.replyPublic(message, 'Command: ' + message.command + ' Message: ' + message.text);
});


controller.on('create_incoming_webhook', function (bot, webhook_config) {
  bot.sendWebhook({
    text: ':thumbsup: Incoming webhook successfully configured'
  });
});

// Allow us to accept commands here as well, for ease of debugging.
//var bot = controller.spawn({
//  token: process.env.BOT_TOKEN
//});
//
//bot.startRTM(function(err, bot, payload) {
//  if (err) {
//    throw new Error('Could not connect to Slack');
//  }
//});

// give the bot something to listen for.
controller.hears('guess', 'direct_message,direct_mention,mention', function (bot, message) {
  bot.reply(message, '<-- your guess.');
});