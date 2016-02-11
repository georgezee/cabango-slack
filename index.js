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
      game.addVote(message.user_name, message.text);
      bot.replyPrivate(message, 'Voting for: ' + message.text);
      break;

    case '/guess':
      game.addGuess(message.user_name, message.text);
      bot.replyPrivate(message, 'Added answer: ' + message.text);
      break;

    case '/game':
      if (message.text === 'start') {
        game.startGame();
        bot.replyPublic(message, 'Starting Game');
      } else if (message.text == 'stop') {
        bot.replyPublic(message, 'Stopping Game');
        game.stopGame();
      }
      break;
  }
});


controller.on('create_incoming_webhook', function (bot, webhook_config) {
  bot.sendWebhook({
    text: ':thumbsup: Incoming webhook successfully configured'
  });
});

// Allow us to accept commands here as well, for ease of debugging.
var bot = controller.spawn({
 token: process.env.BOT_TOKEN
});

bot.startRTM(function(err, bot, payload) {
 if (err) {
   throw new Error('Could not connect to Slack');
 }
});

// Give the bot something to listen for.
controller.hears('guess', 'direct_message,direct_mention,mention', function (bot, message) {
  var matches = message.text.match(/guess (.*)/i);
  var command_text = matches[1];
  
  game.addGuess(message.user, command_text);
  bot.replyPrivate(message, 'Added answer: ' + command_text);

});

controller.hears('vote', 'direct_message,direct_mention,mention', function (bot, message) {
  var matches = message.text.match(/vote (.*)/i);
  if (matches === null) { return; }
  
  var command_text = matches[1];

  game.addVote(message.user, command_text);
  bot.replyPrivate(message, 'Voting for: ' + command_text);
  
});

controller.hears('game', 'direct_message,direct_mention,mention', function (bot, message) {
  var matches = message.text.match(/game (.*)/i);

  if (matches === null) { return; }
  
  var command_text = matches[1];

  if (command_text === 'start') {
    game.startGame();
    bot.replyPublic(message, 'Starting Game');
  } else if (command_text == 'stop') {
    bot.replyPublic(message, 'Stopping Game');
    game.stopGame();
  }
  
});