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

var game = new Game(controller);

controller.setupWebserver(process.env.PORT || 5000, function (err, webserver) {
  controller.createWebhookEndpoints(webserver);

  controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });


});

controller.on('slash_command',function(bot, message) {
  switch (message.command) {
    case '/vote':
      game.addVote(message.text);
      break;

    case '/guess':
      game.addGuess(message.user_name, message.text);
      break;

    case '/game':
      if (message.text === 'start') {
        game.startGame();
      } else if (message.text == 'stop') {
        game.stopGame();
      }
      break;
  }

  bot.replyPrivate(message.text);
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
//controller.hears('guess', 'direct_message,direct_mention,mention', function (bot, message) {
//  bot.reply(message, '<-- your guess.');
//});